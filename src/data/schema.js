'use strict';

var Substance = require('../basics');
var Node = require('./node');
var NodeFactory = require('./node_factory');

function Schema(name, version) {
  this.name = name;
  this.version = version;
  this.nodeFactory = new NodeFactory();
  // add built-in node classes
  this.nodeFactory.addNodes(this.getBuiltIns());
}

Schema.Prototype = function() {

  this.addNodes = function(nodes) {
    if (!nodes) return;
    for (var i = 0; i < nodes.length; i++) {
      Node.initNodeClass(nodes[i]);
      this.nodeFactory.register(nodes[i]);
    }
  };

  this.getNodeClass = function(name) {
    return this.nodeFactory.get(name);
  };

  this.getNodeFactory = function() {
    return this.nodeFactory;
  };

  function getJsonForNodeClass(nodeClass) {
    var nodeSchema = {};
    if (nodeClass.static.hasOwnProperty('schema')) {
      nodeSchema.properties = Substance.clone(nodeClass.static.schema);
    }
    // add 'parent' attribute if the nodeClass has a parent
    return nodeSchema;
  }

  this.toJSON = function() {
    var data = {
      id: this.name,
      version: this.version,
      types: {}
    };
    this.nodeFactory.each(function(nodeClass, name) {
      data.types[name] = getJsonForNodeClass(nodeClass);
    });
    return data;
  };

  this.createNode = function(type, data) {
    var node = this.nodeFactory.create(type, data);
    return node;
  };

  this.getBuiltIns = function() {
    return [ Node ];
  };
};

Substance.initClass(Schema);

module.exports = Schema;
