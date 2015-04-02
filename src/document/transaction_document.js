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
    this.data.addIndex(name, Object.create(index));
  }, this);
}

TransactionDocument.Prototype = function() {

  this.create = function(nodeData) {
    return this.data.create(nodeData);
  };

  this.delete = function(nodeId) {
    return this.data.delete(nodeId);
  };

  this.save = function() {
    this.document._saveTransaction(this.ops);
    this.ops = [];
  };

  this.cancel = function() {
    // revert all recorded changes
    for (var i = this.ops.length - 1; i >= 0; i--) {
      this.data.apply(this.ops[i].invert());
    }
  };

};

Substance.initClass(TransactionDocument);

module.exports = TransactionDocument;