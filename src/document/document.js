'use strict';

var Substance = require('../basics');
var Data = require('../data');

var AnnotationIndex = require('./annotation_index');
var TransactionDocument = require('./transaction_document');
var DocumentListeners = require('./document_listeners');
var DocumentHistory = require('./document_history');

function Document( schema, seed ) {
  Substance.EventEmitter.call(this);

  this.schema = schema;
  this.data = new Data.IncrementalGraph({
    seed: seed,
    didCreateNode: Substance.bind(this._didCreateNode, this),
    didDeleteNode: Substance.bind(this._didDeleteNode, this),
  });

  this.annotationIndex = this.addIndex('annotations', new AnnotationIndex(this));

  this.history = new DocumentHistory(this);

  // the stage is a essentially a clone of this document
  // used to apply a sequence of document operations
  // without touching this document
  this.stage = new TransactionDocument(this);
  this.isTransacting = false;
}

Document.Prototype = function() {

  this.getSchema = function() {
    return this.schema;
  };

  this.get = function(path) {
    return this.data.get(path);
  };

  this.getNodes = function() {
    return this.data.getNodes();
  };

  this.addIndex = function(name, index) {
    return this.data.addIndex(name, index);
  };

  this.getIndex = function(name) {
    return this.data.getIndex(name);
  };

  this.toJSON = function() {
    return {
      schema: [this.schema.name, this.schema.version],
      nodes: this.getNodes()
    };
  };

  // Document manipulation
  //
  // var tx = doc.startTransaction()
  // tx.create(...);
  // ...
  // tx.save();
  //
  // Note: there is no direct manipulation without transaction
  this.startTransaction = function() {
    if (this.isTransacting) {
      throw new Error('Nested transactions are not supported.');
    }
    this.isTransacting = true;
    // TODO: maybe we need to prepare the stage
    return this.stage;
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

  this._finishTransaction = function() {
    if (!this.isTransacting) {
      throw new Error('Not in a transaction.');
    }
    // TODO: notify external listeners
    this.isTransacting = false;
    this.history.setRecoveryPoint();

    transactionChanges.traverse(function(path, ops) {
      this.emit('transaction', path, ops);
    }, this);
  };

};

Substance.inherit(Document, Substance.EventEmitter);

module.exports = Document;
