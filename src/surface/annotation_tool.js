var Substance = require("../basics");
var Selection = Substance.Document.Selection;

// Mixin with helpers to implement an AnnotationTool
function AnnotationTool() {}

AnnotationTool.Prototype = function() {

  this.annotationType = "annotation";

  this.getDocument = function() {
    throw new Error('Contract: an AnnotationTool must implement AnnotationTool.getDocument()');
  };

  this.getToolState = function() {
    throw new Error('Contract: an AnnotationTool must implement AnnotationTool.getToolState()');
  };

  this.setToolState = function(/*newState*/) {
    throw new Error('Contract: an AnnotationTool must implement AnnotationTool.setToolState()');
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
    return sel.isInside(annoSel);
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
    return (sel.isLeftAligned(annoSel) || sel.isRightAligned(annoSel)) && !sel.equals(annoSel);
  };

  this.updateToolState = function(sel) {
    // Note: toggling of a subject reference is only possible when
    // the subject reference is selected and the
    if (sel.isNull() || sel.isCollapsed() || !sel.isPropertySelection()) {
      return this.setToolState({
        active: false,
        selected: false
      });
    }
    // Extract range and matching annos of current selection
    var annos = this.getDocument().getAnnotationsForSelection(sel, { type: this.annotationType });
    var annoSels = annos.map(function(anno) { return anno.getSelection(); });
    var mode;
    if (this.canCreate(annoSels, sel)) {
      mode = "create";
    } else if (this.canFusion(annoSels, sel)) {
      mode = "fusion";
    } else if (this.canRemove(annoSels, sel)) {
      mode = "remove";
    } else if (this.canTruncate(annoSels, sel)) {
      mode = "truncate";
    } else if (this.canExpand(annoSels, sel)) {
      mode = "expand";
    }
    var newState = {
      active: true,
      selected: false,
      mode: mode,
      sel: sel,
      annos: annos,
      annoSels: annoSels
    };
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
    var annotation = {
      id: Substance.uuid(this.annotation.type),
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

  this.handleTruncate = function(annoSels, sel) {
    var doc = this.getDocument();
    var tx = doc.startTransaction({ selection: sel });
    try {
      var annoSel = annoSels[0];
      var nodeId = annoSel.path[0];
      var anno = doc.get(nodeId);
      var newAnnoSel = annoSel.truncate(sel);
      anno.updateSelection(tx, newAnnoSel);
      tx.save({ selection: sel });
    } finally {
      tx.cleanup();
    }
  };

  this.handleExpand = function(annoSels, sel) {
    var doc = this.getDocument();
    var tx = doc.startTransaction({ selection: sel });
    try {
      var annoSel = annoSels[0];
      var newAnnoSel = annoSel.expand(sel);
      var nodeId = annoSel.path[0];
      var anno = doc.get(nodeId);
      anno.updateSelection(tx, newAnnoSel);
      tx.save({ selection: sel });
    } finally {
      tx.cleanup();
    }
  };
};

Substance.initClass(AnnotationTool);

module.exports = AnnotationTool;
