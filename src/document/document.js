'use strict';

var Substance = require('../basics');
var Data = require('../data');
var PathAdapter = Substance.PathAdapter;

var AnnotationIndex = require('./annotation_index');
var TransactionDocument = require('./transaction_document');
var DocumentChange = require('./document_change');

function Document( schema, seed ) {
  Substance.EventEmitter.call(this);

  this.schema = schema;
  this.data = new Data.IncrementalGraph(schema, {
    seed: seed,
    didCreateNode: Substance.bind(this._didCreateNode, this),
    didDeleteNode: Substance.bind(this._didDeleteNode, this),
  });

  this.annotationIndex = this.addIndex('annotations', new AnnotationIndex(this));

  // the stage is a essentially a clone of this document
  // used to apply a sequence of document operations
  // without touching this document
  this.stage = new TransactionDocument(this);
  this.isTransacting = false;

  this.done = [];
  this.undone = [];

  this.documentListeners = new PathAdapter();
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

  this.finishTransaction = function() {
    if (!this.isTransacting) {
      throw new Error('Not in a transaction.');
    }
    // TODO: notify external listeners
    this.isTransacting = false;
    var ops = this.stage.getOperations();
    var documentChange = new DocumentChange(ops);

    this.undone = [];
    this.apply(documentChange, 'skipStage');
  };

  this.apply = function(documentChange, skipStage) {
    if (this.isTransacting) {
      throw new Error('Can not replay a document change during transaction.');
    }
    // Note: we apply everything doubled, to keep the staging clone up2date.
    if (!skipStage) {
      this.stage.apply(documentChange);
    }
    Substance.each(documentChange.ops, function(op) {
      this.data.apply(op);
    }, this);
    this.done.push(documentChange);
    this.notifyDocumentChangeListeners(documentChange);
  };

  this.addDocumentChangeListener = function(listener, path, fn) {
    var key = path.concat(['listeners']);
    var listeners = this.documentListeners.get(key);
    if (!listeners) {
      listeners = [];
      this.documentListeners.set(key, listeners);
    }
    listeners.push({ fn: fn, listener: listener });
  };

  // TODO: it would be cool if we would just need to provide the listener instance, no path
  this.removeDocumentChangeListener = function(listener, path) {
    var key = path.concat(['listeners']);
    var listeners = this.documentListeners.get(key);
    if (listeners) {
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i].listener === listener) {
          listeners.splice(i, 1);
          return;
        }
      }
    }
  };

  this.notifyDocumentChangeListeners = function(documentChange) {
    var documentListeners = this.documentListeners;
    documentChange.traverse(function(path, ops) {
      var key = path.concat(['listeners']);
      var listeners = documentListeners.get(key);
      Substance.each(listeners, function(entry) {
        entry.fn.call(entry.listener, documentChange, ops);
      });
    }, this);
  };

};

Substance.inherit(Document, Substance.EventEmitter);

module.exports = Document;
