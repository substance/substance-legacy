'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;
var Data = require('../data');
var ContainerAnnotation = require('./container_annotation');

var ContainerAnnotationIndex = function(doc) {
  this.doc = doc;
  this.byPath = new PathAdapter();
};

ContainerAnnotationIndex.Prototype = function() {

  this.select = function(node) {
    return (node instanceof ContainerAnnotation);
  };

  this.reset = function() {
    this.byPath.clear();
    this.initialize();
  };

  this.get = function(containerId, path) {
    path = [containerId].concat(path);
    var anchors = this.byPath.get(path) || {};
    anchors = Substance.map(anchors, function(anchor) {
      return anchor;
    });
    return anchors;
  };

  this.create = function(containerAnno) {
    var startAnchor = containerAnno.getStartAnchor();
    var endAnchor = containerAnno.getEndAnchor();
    this.byPath.set(startAnchor.getIndexKey(), startAnchor);
    this.byPath.set(endAnchor.getIndexKey(), endAnchor);
  };

  this.delete = function(containerAnno) {
    var startAnchor = containerAnno.getStartAnchor();
    var endAnchor = containerAnno.getEndAnchor();
    this.byPath.delete(startAnchor.getIndexKey(), startAnchor);
    this.byPath.delete(endAnchor.getIndexKey(), endAnchor);
  };

  this.update = function(node, path, newValue, oldValue) {
    if (this.select(node)) {
      var anchor = null;
      if (path[1] === 'startPath') {
        anchor = node.getStartAnchor();
      } else if (path[1] === 'endPath') {
        anchor = node.getEndAnchor();
      }
      this.byPath.delete([node.container].concat(oldValue).concat([node.id]), anchor);
      this.byPath.set(anchor.getIndexKey(), anchor);
    }
  };

};

Substance.inherit(ContainerAnnotationIndex, Data.Index);

module.exports = ContainerAnnotationIndex;