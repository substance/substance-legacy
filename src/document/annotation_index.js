'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;
var Data = require('../data');
var Annotation = require('./annotation');

var AnnotationIndex = function(doc) {
  this.doc = doc;
  this.byPath = new PathAdapter();
  this.byType = new PathAdapter();
};

AnnotationIndex.Prototype = function() {

  this.property = "path";

  this.select = function(node) {
    return (node instanceof Annotation);
  };

  this.reset = function() {
    this.byPath.clear();
    this.byType.clear();
    this.initialize();
  };

  // TODO: use object interface? so we can combine filters (path and type)
  this.get = function(path, start, end, type) {
    var annotations = this.byPath.get(path) || {};
    annotations = Substance.map(annotations, function(anno) {
      return anno;
    });

    /* jshint eqnull:true */
    // null check for null or undefined
    if (start != null) {
      annotations = Substance.filter(annotations, AnnotationIndex.filterByRange(annotations, start, end));
    }
    if (type) {
      annotations = Substance.filter(annotations, AnnotationIndex.filterByType(annotations, type));
    }
    return annotations;
  };

  this.create = function(anno) {
    this.byType.set([anno.type, anno.id], anno);
    this.byPath.set(anno.path.concat([anno.id]), anno);
  };

  this.delete = function(anno) {
    this.byType.delete([anno.type, anno.id]);
    this.byPath.delete(anno.path.concat([anno.id]));
  };

  this.update = function(node, path, newValue, oldValue) {
    if (this.select(node) && path[1] === this.property) {
      this.delete({ id: node.id, type: node.type, path: oldValue });
      this.create(node);
    }
  };

};

Substance.inherit(AnnotationIndex, Data.Index);

AnnotationIndex.filterByRange = function(start, end) {
  return function(anno) {
    var aStart = anno.range[0];
    var aEnd = anno.range[1];
    var overlap = (aEnd >= start);
    // Note: it is allowed to omit the end part
    if (end) {
      overlap &= (aStart <= end);
    }
    return overlap;
  };
};

AnnotationIndex.filterByType = function(annotations, type) {
  return function(anno) {
    return anno.instanceOf(type);
  };
};

module.exports = AnnotationIndex;