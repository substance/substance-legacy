'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;
var Data = require('../data');
var ContainerAnnotation = require('./container_annotation');

var ContainerAnnotationIndex = function(doc) {
  this.doc = doc;
  this.byPath = new PathAdapter.Arrays();
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
    var anchors = this.byPath.get(path);
    if (anchors) {
      return anchors.slice(0);
    } else {
      return [];
    }
  };

  this.create = function(containerAnno) {
    var containerId = containerAnno.container;
    var startAnchor = containerAnno.getStartAnchor();
    var endAnchor = containerAnno.getEndAnchor();
    this.byPath.add([containerId].concat(startAnchor.getPath()), startAnchor);
    this.byPath.add([containerId].concat(endAnchor.getPath()), endAnchor);
  };

  this.delete = function(containerAnno) {
    var containerId = containerAnno.container;
    var startAnchor = containerAnno.getStartAnchor();
    var endAnchor = containerAnno.getEndAnchor();
    this.byPath.remove([containerId].concat(startAnchor.getPath()), startAnchor);
    this.byPath.remove([containerId].concat(endAnchor.getPath()), endAnchor);
  };

  this.update = function(node, path, newValue, oldValue) {
    if (this.select(node)) {
      var containerId = node.container;
      var anchor = null;
      if (path[1] === 'startPath') {
        anchor = node.getStartAnchor();
      } else if (path[1] === 'endPath') {
        anchor = node.getEndAnchor();
      } else {
        return;
      }
      this.byPath.remove([node.container].concat(oldValue), anchor);
      this.byPath.add([containerId].concat(anchor.getPath()), anchor);
    }
  };

};

Substance.inherit(ContainerAnnotationIndex, Data.Index);

module.exports = ContainerAnnotationIndex;