'use strict';

var Node = require('./node');

// Annotation
// --------
//
// An annotation can be used to overlay text and give it a special meaning.
// Annotations only work on text properties. If you want to annotate multiple
// nodes you have to use a ContainerAnnotation.
// 
// Properties:
//   - path: Identifies a text property in the document (e.g. ["text_1", "content"])
//   - range: Identies annotated characters by its start and end position (e.g. [25, 47])

var Annotation = Node.extend({
  name: "annotation",

  properties: {
    path: ['array', 'string'],
    range: ['array', 'number']
  },

  canSplit: function() {
    return true;
  }
});

module.exports = Annotation;
