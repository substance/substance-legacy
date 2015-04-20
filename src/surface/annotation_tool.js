var Substance = require("../basics");
var Selection = Substance.Document.Selection;

// Mixin with helpers to implement an AnnotationTool
function AnnotationTool() {
}

AnnotationTool.Prototype = function() {

  this.getDocument = function() {
    throw new Error('Contract: an AnnotationTool must implement getDocument()');
  };

  this.getToolState = function() {
    throw new Error('Contract: an AnnotationTool must implement getToolState()');
  };

  this.setToolState = function(/*newState*/) {
    throw new Error('Contract: an AnnotationTool must implement setToolState()');
  };

  this.getAnnotationType = function() {
    throw new Error('Contract: an AnnotationTool must implement getAnnotationType()');
  };

  // When there's no existing annotation overlapping, we create a new one.
  this.canCreate = function(annoSels) {
    return (annoSels.length === 0);
  };

  // When more than one annotation overlaps with the current selection
  this.canFusion = function(annoSels) {
    return (annoSels.length >= 2);
  };

  // When the cursor or selection is inside an existing annotation
  this.canRemove = function(annoSels, sel) {
    if (annoSels.length !== 1) return false;
    var annoSel = annoSels[0];
    return sel.isInsideOf(annoSel);
  };

  // When there's some overlap with only a single annotation we do an expand
  this.canExpand = function(annoSels, sel) {
    if (annoSels.length !== 1) return false;
    var annoSel = annoSels[0];
    return sel.overlaps(annoSel);
  };

  this.canTruncate = function(annoSels, sel) {
    if (annoSels.length !== 1) return false;
    var annoSel = annoSels[0];
    return (sel.isLeftAlignedWith(annoSel) || sel.isRightAlignedWith(annoSel)) && !sel.equals(annoSel);
  };

  this.updateToolState = function(sel) {
    // Note: toggling of a subject reference is only possible when
    // the subject reference is selected and the
    if (sel.isNull()) {
      return this.setToolState({
        active: false,
        selected: false
      });
    }
    // Extract range and matching annos of current selection
    var annos = this.getDocument().getAnnotationsForSelection(sel, { type: this.annotationType });
    var annoSels = annos.map(function(anno) { return anno.getSelection(); });
    var newState = {
      active: true,
      selected: false,
      mode: null,
      sel: sel,
      annos: annos,
      annoSels: annoSels
    };
    if (this.canCreate(annoSels, sel)) {
      newState.mode = "create";
    } else if (this.canFusion(annoSels, sel)) {
      newState.mode = "fusion";
    } else if (this.canRemove(annoSels, sel)) {
      newState.selected = true;
      newState.mode = "remove";
    } else if (this.canTruncate(annoSels, sel)) {
      newState.selected = true;
      newState.mode = "truncate";
    } else if (this.canExpand(annoSels, sel)) {
      newState.mode = "expand";
    } else {
      return this.setToolState({
        active: false,
        selected: false
      });
    }
    this.setToolState(newState);
  };

  this.performAction = function() {
    var state = this.getToolState();
    if (state.sel.isNull() || !state.sel.isPropertySelection()) return;
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
      default:
        console.error('Unknown mode: %s', this.state.mode);
    }
  };

  this.handleCreate = function(state) {
    var sel = state.sel;
    if (sel.isNull()) return;
    var doc = this.getDocument();
    var tx = doc.startTransaction({ selection: sel });
    try {
      this.createAnnotationForSelection(tx, sel);
      tx.save({ selection: sel });
    } finally {
      tx.cleanup();
    }
  };

  this.createAnnotationForSelection = function(tx, sel) {
    var annotationType = this.getAnnotationType();
    var annotation = {
      id: Substance.uuid(annotationType),
      type: annotationType,
    };
    if (sel.isPropertySelection()) {
      annotation.path = sel.getPath();
    } else {
      annotation.startPath = sel.start.path;
      annotation.endPath = sel.end.path;
    }
    annotation.startOffset = sel.getStartOffset();
    annotation.endOffset = sel.getEndOffset();
    // start the transaction with an initial selection
    return tx.create(annotation);
  };

  this.handleFusion = function(state) {
    var doc = this.getDocument();
    var sel = state.sel;
    var tx = doc.startTransaction({ selection: sel });
    try {
      Substance.each(state.annoSels, function(annoSel) {
        sel = sel.expand(annoSel);
      });
      Substance.each(state.annos, function(anno) {
        tx.delete(anno.id);
      });
      this.createAnnotationForSelection(tx, sel);
      tx.save({ selection: sel });
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
      tx.save({ selection: Selection.create(sel.start) });
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
      var annoSel = state.annoSels[0];
      var newAnnoSel = annoSel.truncate(sel);
      anno.updateRange(tx, newAnnoSel);
      tx.save({ selection: sel });
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
      var annoSel = state.annoSels[0];
      var newAnnoSel = annoSel.expand(sel);
      anno.updateRange(tx, newAnnoSel);
      tx.save({ selection: sel });
    } finally {
      tx.cleanup();
    }
  };
};

Substance.initClass(AnnotationTool);

module.exports = AnnotationTool;
