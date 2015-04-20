'use strict';

var Substance = require('../basics');
var Data = require('../data');

function TransactionDocument(document) {

  this.document = document;
  this.schema = document.schema;
  this.ops = [];
  // app information state information used to recover the state before the transaction
  // when calling undo
  this.before = {};

  this.data = new Data.IncrementalGraph(document.schema, {
    seed: document.data.seed,
    didCreateNode: Substance.bind(this._didCreateNode, this),
    didDeleteNode: Substance.bind(this._didDeleteNode, this),
  });

  Substance.each(document.data.indexes, function(index, name) {
    this.data.addIndex(name, index.clone());
  }, this);

  // reset containers initially
  this.containers = this.getIndex('type').get('container');
  Substance.each(this.containers, function(container) {
    container.reset();
  });
}

TransactionDocument.Prototype = function() {

  this.reset = function() {
    this.ops = [];
    this.before = {};
    // reset containers initially
    Substance.each(this.containers, function(container) {
      container.reset();
    });
  };

  this.get = function(path) {
    return this.data.get(path);
  };

  this.create = function(nodeData) {
    var op = this.data.create(nodeData);
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
    return this.data.get(nodeData.id);
  };

  this.delete = function(nodeId) {
    var op = this.data.delete(nodeId);
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
  };

  this.set = function(path, value) {
    var op = this.data.set(path, value);
    this._updateContainers(op);
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
  };

  this.update = function(path, diffOp) {
    var op = this.data.update(path, diffOp);
    this._updateContainers(op);
    if (this.document.isTransacting) {
      this.ops.push(op);
    }
  };

  this._updateContainers = function(op) {
    var containers = this.containers;
    Substance.each(containers, function(container) {
      container.update(op);
    });
  };

  this.save = function(afterState, info) {
    var before = this.before;
    var after = Substance.extend({}, before, afterState);
    this.document._saveTransaction(before, after, info);
    // reset after finishing
    this.reset();
  };

  this.cancel = function() {
    // revert all recorded changes
    for (var i = this.ops.length - 1; i >= 0; i--) {
      this.data.apply(this.ops[i].invert());
    }
    this.document._cancelTransaction();
    this.reset();
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
      this._updateContainers(op);
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