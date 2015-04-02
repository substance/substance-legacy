'use strict';

var Substance = require('../basics');
var Data = require('../data');
var AnnotationIndex = require('./annotation_index');
var ChangeMap = require('./change_map');

function TransactionDocument(document) {

  this.document = document;
  this.schema = document.schema;
  this.ops = [];

  this.data = new Data.IncrementalGraph(document.schema, {
    seed: document.data.seed,
    didCreateNode: document.data.didCreateNode,
    didDeleteNode: document.data.didDeleteNode,
  });

  Substance.each(document.data.indexes, function(index, name) {
    this.data.addIndex(name, index.clone());
  }, this);
}

TransactionDocument.Prototype = function() {

  this.create = function(nodeData) {
    var op = this.data.create(nodeData);
    this.ops.push(op);
    return this.data.get(nodeData.id);
  };

  this.delete = function(nodeId) {
    var op = this.data.delete(nodeId);
    this.ops.push(op);
  };

  this.set = function(path, value) {
    var op = this.data.set(path, value);
    this.ops.push(op);
  };

  this.update = function(path, diffOp) {
    var op = this.data.update(path, diffOp);
    this.ops.push(op);
  };

  this.save = function() {
    this.document.finishTransaction();
    this.ops = [];
  };

  this.cancel = function() {
    // revert all recorded changes
    for (var i = this.ops.length - 1; i >= 0; i--) {
      this.data.apply(this.ops[i].invert());
    }
    this.ops = [];
  };

  this.finish = function() {
    if (this.document.isTransacting) {
      this.cancel();
    }
  };

  this.getOperations = function() {
    return this.ops;
  };

  this.apply = function(documentChange) {
    Substance.each(documentChange.ops, function(op) {
      this.data.apply(op);
    }, this);
  };

};

Substance.initClass(TransactionDocument);

module.exports = TransactionDocument;