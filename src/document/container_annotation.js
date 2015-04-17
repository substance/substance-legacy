'use strict';

var Substance = require('../basics');
var Node = require('./node');


// Container Annotation
// ----------------
//
// Describes an annotation sticking on a container that can span over multiple
// nodes.
//
// Here's an example:
//
// {
//   "id": "subject_reference_1",
//   "type": "subject_reference",
//   "container": "content",
//   "startPath": ["text_2", "content"],
//   "startOffset": 100,
//   "endPath": ["text_4", "content"],
//   "endOffset": 40
// }


var ContainerAnnotation = Node.extend({
  name: "container_annotation",

  properties: {
    // id of container node
    container: 'string',
    startPath: ['array', 'string'],
    startOffset: 'number',
    endPath: ['array', 'string'],
    endOffset: 'number'
  },

  getStartAnchor: function() {
    if (!this._startAnchor) {
      this._startAnchor = new ContainerAnnotation.Anchor(this, 'isStart');
    }
    return this._startAnchor;
  },

  getEndAnchor: function() {
    if (!this._endAnchor) {
      this._endAnchor = new ContainerAnnotation.Anchor(this);
    }
    return this._endAnchor;
  },

});

ContainerAnnotation.Anchor = function(node, isStart) {
  this.node = node;
  this.id = node.id;
  this.container = node.container;
  this.isStart = !!isStart;
  Object.freeze(this);
};

ContainerAnnotation.Anchor.Prototype = function() {
  this.zeroWidth = true;
  this.getClassNames = function() {
    return (this.node.getClassNames()+" anchor "+(this.isStart?"start-anchor":"end-anchor"));
  };
};

Substance.initClass(ContainerAnnotation.Anchor);

Object.defineProperties(ContainerAnnotation.Anchor.prototype, {
  path: {
    get: function() {
      return (this.isStart ? this.node.startPath : this.node.endPath);
    },
    set: function() { throw new Error('Immutable!'); }
  },
  offset: {
    get: function() {
      return (this.isStart ? this.node.startOffset : this.node.endOffset);
    },
    set: function() { throw new Error('Immutable!'); }
  },
});

module.exports = ContainerAnnotation;