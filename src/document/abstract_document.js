'use strict';

var _ = require('../basics/helpers');
var Substance = require('../basics');
var Data = require('../data');
var Selection = require('./selection');
var PropertySelection = require('./property_selection');
var ContainerSelection = require('./container_selection');
var TableSelection = require('./table_selection');

function AbstractDocument(schema) {
  Substance.EventEmitter.call(this);
  this.schema = schema;

  this.data = new Data.Incremental(schema, {
    didCreateNode: Substance.bind(this._didCreateNode, this),
    didDeleteNode: Substance.bind(this._didDeleteNode, this),
  });
}

AbstractDocument.Prototype = function() {

  this.isTransaction = function() {
    return false;
  };

  this.newInstance = function() {
    throw new Error('Must be implemented in subclass.');
  };

  this.initialize = function() {
    // add things to the document, such as containers etc.
  };

  this.addIndex = function(name, index) {
    return this.data.addIndex(name, index);
  };

  this.getIndex = function(name) {
    return this.data.getIndex(name);
  };

  this.reset = function() {
    this.containers = this.getIndex('type').get('container');
    // reset containers initially
    Substance.each(this.containers, function(container) {
      container.reset();
    });
  };

  this._create = function(nodeData) {
    var op = this.data.create(nodeData);
    this._updateContainers(op);
    return op;
  };

  this._delete = function(nodeId) {
    var op = this.data.delete(nodeId);
    this._updateContainers(op);
    return op;
  };

  this._update = function(path, diff) {
    var op = this.data.update(path, diff);
    this._updateContainers(op);
    return op;
  };

  this._set = function(path, value) {
    var op = this.data.set(path, value);
    this._updateContainers(op);
    return op;
  };

  this.documentDidLoad = function() {};

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

  this.loadSeed = function(seed) {
    _.each(seed.nodes, function(nodeData) {
      var id = nodeData.id;
      if (this.get(id)) {
        this.delete(id);
      }
      this.create(nodeData);
    }, this);
    this.documentDidLoad();
  };

  this.getTextForSelection = function(sel) {
    var result = [];
    var text;
    if (!sel || sel.isNull()) {
      return "";
    } else if (sel.isPropertySelection()) {
      text = this.get(sel.start.path);
      result.push(text.substring(sel.start.offset, sel.end.offset));
    } else if (sel.isContainerSelection()) {
      var container = this.get(sel.container.id);
      var components = container.getComponentsForRange(sel.range);
      for (var i = 0; i < components.length; i++) {
        var comp = components[i];
        text = this.get(comp.path);
        if (components.length === 1) {
          result.push(text.substring(sel.start.offset, sel.end.offset));
        } else if (i===0) {
          result.push(text.substring(sel.start.offset));
        } else if (i===components.length-1) {
          result.push(text.substring(0, sel.end.offset));
        } else {
          result.push(text);
        }
      }
    }
    return result.join('');
  };

  this.toJSON = function() {
    var nodes = {};
    _.each(this.getNodes(), function(node) {
      nodes[node.id] = node.toJSON();
    });
    return {
      schema: [this.schema.name, this.schema.version],
      nodes: nodes
    };
  };

  this.create = function(nodeData) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  this.delete = function(nodeId) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  this.set = function(path, value) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  this.update = function(path, diff) {
    /* jshint unused:false */
    throw new Error('Method is abstract.');
  };

  this.setText = function(path, text, annotations) {
    var idx;
    var oldAnnos = this.getIndex('annotations').get(path);
    // TODO: what to do with container annotations
    for (idx = 0; idx < oldAnnos.length; idx++) {
      this.delete(oldAnnos[idx].id);
    }
    this.set(path, text);
    for (idx = 0; idx < annotations.length; idx++) {
      this.create(annotations[idx]);
    }
  };

  /**
   * Creates a selection which is attached to this document.
   * Every selection implementation provides its own
   * parameter format which is basically a JSON representation.
   *
   * @param an object describing the selection.
   * @example
   *   doc.createSelection({
   *     type: 'property',
   *     path: [ 'text1', 'content'],
   *     startOffset: 10,
   *     endOffset: 20
   *   })
   */
  this.createSelection = function(sel) {
    if (!sel) {
      return Selection.nullSelection;
    }
    switch(sel.type) {
      case 'property':
        return new PropertySelection(sel).attach(this);
      case 'container':
        return new ContainerSelection(sel).attach(this);
      case 'table':
        return new TableSelection(sel).attach(this);
      default:
        throw new Error('Unsupported selection type', sel.type);
    }
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

  this._updateContainers = function(op) {
    var containers = this.containers;
    _.each(containers, function(container) {
      container.update(op);
    });
  };
};

Substance.inherit(AbstractDocument, Substance.EventEmitter);

module.exports = AbstractDocument;
