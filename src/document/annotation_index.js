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
    var sStart = start;
    var sEnd = end;
    var annotations = this.byPath.get(path) || {};

    var result = [];
    // Filter the annotations by the given char range
    if (start) {
      // Note: this treats all annotations as if they were inclusive (left+right)
      // TODO: maybe we should apply the same rules as for Transformations?
      Substance.each(annotations, function(anno) {
        if (type && anno.type !== type) return; // skip
        var aStart = anno.range[0];
        var aEnd = anno.range[1];
        var overlap = (aEnd >= sStart);
        // Note: it is allowed to omit the end part
        if (sEnd) {
          overlap &= (aStart <= sEnd);
        }
        if (overlap) {
          result.push(anno);
        }
      }, this);
    } else {
      Substance.each(annotations, function(anno) {
        if (type && anno.type !== type) return; // skip
        result.push(anno);
      }, this);
    }
    return result;
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

module.exports = AnnotationIndex;