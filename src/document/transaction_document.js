'use strict';

var Substance = require('../basics');
var Data = require('../data');

function TransactionDocument(document) {

  this.document = document;
  this.schema = document.schema;
  this.ops = [];

  this.data = new Data.IncrementalGraph(document.schema, {
    seed: document.data.seed,
    didCreateNode: Substance.bind(this._didCreateNode, this),
    didDeleteNode: Substance.bind(this._didDeleteNode, this),
  });

  Substance.each(document.data.indexes, function(index, name) {
    this.data.addIndex(name, index.clone());
  }, this);
}

TransactionDocument.Prototype = function() {

  this.get = function(path) {
    return this.data.get(path);
  };

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

  this.save = function(data, info) {
    this.document.finishTransaction(data, info);
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

  this.cleanup = this.finish;

  this.getOperations = function() {
    return this.ops;
  };

  this.apply = function(documentChange) {
    Substance.each(documentChange.ops, function(op) {
      this.data.apply(op);
    }, this);
  };

  this.getIndex = function(name) {
    return this.data.getIndex(name);
  };

  // Called back by Substance.Data after a node instance has been created
  this._didCreateNode = function(node) {
    // create the node from schema
    node.attach(this);
  };

  this._didDeleteNode = function(node) {
    // create the node from schema
    node.detach(this);
  };

};

Substance.initClass(TransactionDocument);

module.exports = TransactionDocument;