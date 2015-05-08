'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

var Index = function() {
  this.index = new PathAdapter();
};

Index.Prototype = function() {

  this.setGraph = function(graph) {
    this.graph = graph;
  };

  this.reset = function() {
    this.index.clear();
    this.initialize();
  };

  this.initialize = function() {
    Substance.each(this.graph.getNodes(), function(node) {
      if (this.select(node)) {
        this.create(node);
      }
    }, this);
  };

  this.property = "id";

  this.select = function(node) {
    if(!this.type) {
      return true;
    } else {
      return node.isInstanceOf(this.type);
    }
  };

  this.get = function(path) {
    // HACK: unwrap objects on the index when method is called without a path
    if (!path) return this.getAll();
    return this.index.get(path) || {};
  };

  // HACK: When there's no path supplied we need to flatten the index to show all objects that are on the index
  this.getAll = function() {
    var result = {};
    Substance.each(this.index, function(values) {
      Substance.extend(result, values);
    });
    return result;
  };

  this.create = function(node) {
    var values = node[this.property];
    if (!Substance.isArray(values)) {
      values = [values];
    }
    Substance.each(values, function(value) {
      this.index.set([value, node.id], node);
    }, this);
  };

  this.delete = function(node) {
    var values = node[this.property];
    if (!Substance.isArray(values)) {
      values = [values];
    }
    Substance.each(values, function(value) {
      this.index.delete([value, node.id]);
    }, this);
  };

  this.update = function(node, path, newValue, oldValue) {
    if (!this.select(node) || path[1] !== this.property) return;

    var values = oldValue;
    if (!Substance.isArray(values)) {
      values = [values];
    }
    Substance.each(values, function(value) {
      this.index.delete([value, node.id]);
    }, this);
    values = newValue;
    if (!Substance.isArray(values)) {
      values = [values];
    }
    Substance.each(values, function(value) {
      this.index.set([value, node.id], node);
    }, this);
  };

  this.clone = function() {
    var IndexClass = this.constructor;
    var clone = new IndexClass();
    return clone;
  };
};

Substance.initClass( Index );

Index.create = function(prototype) {
  var index = Substance.extend(new Index(), prototype);
  index.clone = function() {
    return Index.create(prototype);
  };
  return index;
};

module.exports = Index;
