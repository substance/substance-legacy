var Substance = require("substance");
var Selection = Substance.Document.Selection;

// Mixin with helpers to implement an AnnotationTool
function AnnotationToolMixin() {
}

AnnotationToolMixin.Prototype = function() {

  this.getDocument = function() {
    throw new Error('Contract: an AnnotationTool must implement AnnotationTool.getDocument()');
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

  this.handleCreate = function(sel, annoData) {
    if (sel.isNull()) return;
    var doc = this.getDocument();
    var tx = doc.startTransaction({ selection: sel });
    try {
      var annotation = Substance.extend({}, annoData);
      annotation.id = annoData.id || annoData.type+"_" + Substance.uuid();
      if (sel.isPropertySelection()) {
        annotation.path = sel.getPath();
      } else {
        annotation.startPath = sel.start.path;
        annotation.endPath = sel.end.path;
      }
      annotation.startOffset = sel.getStartOffset();
      annotation.endOffset = sel.getEndOffset();
      // start the transaction with an initial selection
      annotation = tx.create(annotation);
      tx.save({ selection: sel });
    } finally {
      tx.cleanup();
    }
  };

  this.handleFusion = function(annoSels, sel) {
    var doc = this.getDocument();
    var tx = doc.startTransaction({ selection: sel });
    try {
      tx.save({ selection: sel });
    } finally {
      tx.cleanup();
    }
  };

  this.handleRemove = function(annoSels, sel) {
    var doc = this.getDocument();
    var tx = doc.startTransaction({ selection: sel });
    try {
      // TODO: implement remove
      debugger;
      tx.save({ selection: Selection.create(sel.start) });
    } finally {
      tx.cleanup();
    }
  };

  this.handleTruncate = function(annoSels, sel) {
    var doc = this.getDocument();
    var tx = doc.startTransaction({ selection: sel });
    try {
      // TODO: implement truncate
      debugger;
      tx.save({ selection: sel });
    } finally {
      tx.cleanup();
    }
  };

  this.handleExpand = function(annoSels, sel) {
    var doc = this.getDocument();
    var tx = doc.startTransaction({ selection: sel });
    try {
      // TODO: implement expand
      debugger;
      tx.save({ selection: sel });
    } finally {
      tx.cleanup();
    }
  };
};

Substance.initClass(AnnotationToolMixin);

module.exports = AnnotationToolMixin;
