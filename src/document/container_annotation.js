'use strict';

var Substance = require('../basics');
var Node = require('./node');

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
  this.id = node.id;
  this.node = node;
  this.isStart = !!isStart;
  Object.freeze(this);
};

ContainerAnnotation.Anchor.Prototype = function() {

  this.zeroWidth = true;

  this.getPath = function() {
    return (this.isStart ? this.node.startPath : this.node.endPath);
  };
  this.getOffset = function() {
    return (this.isStart ? this.node.startOffset : this.node.endOffset);
  };
  this.getIndexKey = function() {
    var key = [this.node.container].concat(this.getPath()).concat(this.node.id);
    return key;
  };
  this.getClassNames = function() {
    return (this.node.getClassNames()+" "+(this.isStart?"start-anchor":"end-anchor"));
  };
};

Substance.initClass(ContainerAnnotation.Anchor);

module.exports = ContainerAnnotation;