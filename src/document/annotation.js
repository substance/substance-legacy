'use strict';

var Substance = require('../basics');
var Node = require('./node');
var Selection = require('./selection');

// Annotation
// --------
//
// An annotation can be used to overlay text and give it a special meaning.
// Annotations only work on text properties. If you want to annotate multiple
// nodes you have to use a ContainerAnnotation.
//
// Properties:
//   - path: Identifies a text property in the document (e.g. ["text_1", "content"])
//   - startOffset: the character where the annoation starts
//   - endOffset: the character where the annoation starts

// TODO: in current terminology this is a PropertyAnnotation
var Annotation = Node.extend({
  name: "annotation",

  properties: {
    path: ['array', 'string'],
    startOffset: 'number',
    endOffset: 'number'
  },

  canSplit: function() {
    return true;
  },

  getSelection: function() {
    return Selection.create(this.path, this.startOffset, this.endOffset);
  },

  updateRange: function(tx, sel) {
    if (!sel.isPropertySelection()) {
      throw new Error('Cannot change to ContainerAnnotation.');
    }
    if (!Substance.isEqual(this.startPath, sel.start.path)) {
      tx.set([this.id, 'path'], sel.start.path);
    }
    if (this.startOffset !== sel.start.offset) {
      tx.set([this.id, 'startOffset'], sel.start.offset);
    }
    if (this.endOffset !== sel.end.offset) {
      tx.set([this.id, 'endOffset'], sel.end.offset);
    }
  },

  getText: function() {
    var doc = this.getDocument();
    if (!doc) {
      return "";
    }
    var text = doc.get(this.path);
    return text.substring(this.startOffset, this.endOffset);
  },

});

Object.defineProperties(Annotation.prototype, {
  startPath: {
    get: function() {
      return this.path;
    }
  },
  endPath: {
    get: function() {
      return this.path;
    }
  }
});

module.exports = Annotation;
