var Substance = require("../basics");
var Tool = require('./tool');

function AnnotationTool() {
  Tool.call(this);
}

AnnotationTool.Prototype = function() {
  // blacklist of modes; one of 'create', 'remove', 'truncate', 'expand', 'fusion'
  this.disabledModes = [];

  this.splitContainerSelections = false;

  // Provides the type of the associated annotation node.
  // The default implementation uses the Tool's static name.
  // Override this method to customize.
  this.getAnnotationType = function() {
    if (this.constructor.static.name) {
      return this.constructor.static.name;
    } else {
      throw new Error('Contract: AnnotationTool.static.name should be associated to a document annotation type.');
    }
  };

  this.afterCreate = function() {};

  this.afterFusion = function() {};

  this.afterRemove = function() {};

  this.afterTruncate = function() {};

  this.afterExpand = function() {};

  // When there's no existing annotation overlapping, we create a new one.
  this.canCreate = function(annos, sel) {
    return (annos.length === 0 && !sel.isCollapsed());
  };

  // When more than one annotation overlaps with the current selection
  this.canFusion = function(annos) {
    return (annos.length >= 2);
  };

  // When the cursor or selection is inside an existing annotation
  this.canRemove = function(annos, sel) {
    if (annos.length !== 1) return false;
    var annoSel = annos[0].getSelection();
    return sel.isInsideOf(annoSel);
  };

  // When there's some overlap with only a single annotation we do an expand
  this.canExpand = function(annos, sel) {
    if (annos.length !== 1) return false;
    var annoSel = annos[0].getSelection();
    return sel.overlaps(annoSel) && !sel.isInsideOf(annoSel);
  };

  this.canTruncate = function(annos, sel) {
    if (annos.length !== 1) return false;
    var annoSel = annos[0].getSelection();
    return (sel.isLeftAlignedWith(annoSel) || sel.isRightAlignedWith(annoSel)) && !sel.equals(annoSel);
  };

  this.update = function(surface, sel) {
    this.surface = surface;
    if ( (this.needsEnabledSurface && !surface.isEnabled()) ||
          sel.isNull() ) {
      return this.setDisabled();
    }
    var doc = this.getDocument();
    var annotationType = this.getAnnotationType();
    var isContainerAnno = this.isContainerAnno();
    // Extract range and matching annos of current selection
    var annos;
    if (isContainerAnno) {
      annos = doc.getContainerAnnotationsForSelection(sel, this.getContainer(), {
        type: annotationType
      });
    } else {
      // Don't react on container selections if the associated annotation type
      // is a property annotation.
      // In future we could introduce a multi-annotation (multiple property selections)
      // and create multiple annotations at once.
      if (sel.isContainerSelection() && !this.splitContainerSelections) {
        return this.setDisabled();
      }
      annos = doc.getAnnotationsForSelection(sel, { type: annotationType });
    }

    var newState = {
      surface: surface,
      enabled: true,
      selected: false,
      mode: null,
      sel: sel,
      annos: annos
    };

    if (this.canCreate(annos, sel)) {
      newState.mode = "create";
    } else if (this.canFusion(annos, sel)) {
      newState.mode = "fusion";
    } else if (this.canTruncate(annos, sel)) {
      newState.selected = true;
      newState.mode = "truncate";
    } else if (this.canRemove(annos, sel)) {
      newState.selected = true;
      newState.mode = "remove";
    } else if (this.canExpand(annos, sel)) {
      newState.mode = "expand";
    }
    // Verifies if the detected mode has been disabled by the concrete implementation
    if (!newState.mode || Substance.includes(this.disabledModes, newState.mode)) {
      return this.setDisabled();
    } else {
      this.setToolState(newState);
    }
  };

  this.performAction = function() {
    var state = this.getToolState();
    // TODO: is this really necessary? better just check if the toolstate does not have a proper mode
    if (!state.sel || !state.mode || state.sel.isNull()) return;
    switch (state.mode) {
      case "create":
        return this.handleCreate(state);
      case "fusion":
        return this.handleFusion(state);
      case "remove":
        return this.handleRemove(state);
      case "truncate":
        return this.handleTruncate(state);
      case "expand":
        return this.handleExpand(state);
    }
  };

  this.handleCreate = function(state) {
    var sel = state.sel;
    if (sel.isNull()) return;
    var doc = this.getDocument();
    var tx = doc.startTransaction({ selection: sel });
    try {
      var anno = this.createAnnotationForSelection(tx, sel);
      tx.save({ selection: sel });
      this.afterCreate(anno);
    } finally {
      tx.cleanup();
    }
  };

  this.getAnnotationData = function() {
    return {};
  };

  this.isContainerAnno = function() {
    var doc = this.getDocument();
    var schema = doc.getSchema();
    return schema.isInstanceOf(this.getAnnotationType(), "container_annotation");
  };

  this._createPropertyAnnotations = function(tx, sel) {
    var sels;
    var annotationType = this.getAnnotationType();
    if (sel.isPropertySelection()) {
      sels = [];
    } else if (sel.isContainerSelection()) {
      sels = sel.splitIntoPropertySelections();
    }
    for (var i = 0; i < sels.length; i++) {
      var anno = {
        id: Substance.uuid(annotationType),
        type: annotationType
      };
      Substance.extend(anno, this.getAnnotationData());
      anno.path = sels[i].getPath();
      anno.startOffset = sels[i].getStartOffset();
      anno.endOffset = sels[i].getEndOffset();
      tx.create(anno);
    }
  };

  this.createAnnotationForSelection = function(tx, sel) {
    if (this.splitContainerSelections && sel.isContainerSelection()) {
      return this._createPropertyAnnotations(tx, sel);
    }
    var annotationType = this.getAnnotationType();
    var anno = {
      id: Substance.uuid(annotationType),
      type: annotationType,
    };
    Substance.extend(anno, this.getAnnotationData());
    if (this.isContainerAnno()) {
      anno.startPath = sel.start.path;
      anno.endPath = sel.end.path;
      // HACK: where to get the container id from when sel is a property selection
      anno.container = "content";
    } else if (sel.isPropertySelection()) {
      anno.path = sel.getPath();
    } else {
      throw new Error('Illegal state: can not apply ContainerSelection');
    }
    anno.startOffset = sel.getStartOffset();
    anno.endOffset = sel.getEndOffset();
    // start the transaction with an initial selection
    return tx.create(anno);
  };

  this.handleFusion = function(state) {
    var doc = this.getDocument();
    var sel = state.sel;
    var tx = doc.startTransaction({ selection: sel });
    try {
      Substance.each(state.annos, function(anno) {
        sel = sel.expand(anno.getSelection());
      });
      Substance.each(state.annos, function(anno) {
        tx.delete(anno.id);
      });

      this.createAnnotationForSelection(tx, sel);
      tx.save({ selection: sel });
      this.afterFusion();
    } finally {
      tx.cleanup();
    }
  };

  this.handleRemove = function(state) {
    var doc = this.getDocument();
    var sel = state.sel;
    var tx = doc.startTransaction({ selection: sel });
    try {
      var annoId = state.annos[0].id;
      tx.delete(annoId);
      tx.save({ selection: sel });
      this.afterRemove();
    } finally {
      tx.cleanup();
    }
  };

  this.handleTruncate = function(state) {
    var doc = this.getDocument();
    var sel = state.sel;
    var tx = doc.startTransaction({ selection: sel });
    try {
      var anno = state.annos[0];
      var annoSel = anno.getSelection(); // state.annoSels[0];
      var newAnnoSel = annoSel.truncate(sel);
      anno.updateRange(tx, newAnnoSel);
      tx.save({ selection: sel });
      this.afterTruncate();
    } finally {
      tx.cleanup();
    }
  };

  this.handleExpand = function(state) {
    var doc = this.getDocument();
    var sel = state.sel;
    var tx = doc.startTransaction({ selection: sel });
    try {
      var anno = state.annos[0];
      var annoSel = anno.getSelection(); // state.annoSels[0];
      var newAnnoSel = annoSel.expand(sel);
      anno.updateRange(tx, newAnnoSel);
      tx.save({ selection: sel });
      this.afterExpand();
    } finally {
      tx.cleanup();
    }
  };
};

Substance.inherit(AnnotationTool, Tool);

module.exports = AnnotationTool;
