'use strict';

var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var Node = require('./node');
var NodeFactory = require('./node_factory');

/**
 * Data Schema.
 *
 * @class Data.Schema
 * @constructor
 * @param {String} name
 * @param {String} version
 * @module Data
 */
function Schema(name, version) {
  /**
   * @property {String} name
   */
  this.name = name;
  /**
   * @property {String} version
   */
  this.version = version;
  /**
   * @property {NodeFactory} nodeFactory
   * @private
   */
  this.nodeFactory = new NodeFactory();

  // add built-in node classes
  this.addNodes(this.getBuiltIns());
}

Schema.Prototype = function() {

  /**
   * Add nodes to the schema.
   *
   * @method addNodes
   * @param {Array} nodes Array of Node classes
   */
  this.addNodes = function(nodes) {
    if (!nodes) return;
    for (var i = 0; i < nodes.length; i++) {
      this.nodeFactory.register(nodes[i]);
    }
  };

  /**
   * Get the node class for a type name.
   *
   * @method getNodeClass
   * @param {String} name
   */
  this.getNodeClass = function(name) {
    return this.nodeFactory.get(name);
  };

  /**
   * Provide the node factory.
   *
   * @method getNodeFactory
   * @return A NodeFactory instance.
   * @deprecated Use `this.createNode(type, data)` instead.
   */
  this.getNodeFactory = function() {
    return this.nodeFactory;
  };

  function getJsonForNodeClass(nodeClass) {
    var nodeSchema = {};
    if (nodeClass.static.hasOwnProperty('schema')) {
      nodeSchema.properties = _.clone(nodeClass.static.schema);
    }
    // add 'parent' attribute if the nodeClass has a parent
    return nodeSchema;
  }

  /**
   * Serialize to JSON.
   *
   * @method toJSON
   * @return A plain object describing the schema.
   */
  // TODO: what is this used for? IMO this is not necessary anymore
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

  /**
   * Create a node instance.
   *
   * @method createNode
   * @param {String} type
   * @param {Object} properties
   * @return A new Node instance.
   */
  this.createNode = function(type, properties) {
    var node = this.nodeFactory.create(type, properties);
    return node;
  };

  /**
   * Provide all built-in node classes.
   *
   * Used internally.
   *
   * @method getBuiltIns
   * @protected
   * @return An array of Node classes.
   */
  this.getBuiltIns = function() {
    return [ Node ];
  };

  /**
   * Check if a given type is of given parent type.
   *
   * @method isInstanceOf
   * @param {String} type
   * @param {String} parentType
   * @return True if type instanceof parentType.
   */
  this.isInstanceOf = function(type, parentType) {
    var NodeClass = this.getNodeClass(type);
    if (NodeClass) {
      return Node.static.isInstanceOf(NodeClass, parentType);
    }
    return false;
  };

  /**
   * Iterate over all registered node classes.
   *
   * See {{#crossLink "Registry/each:method"}}Registry.each{{/crossLink}}
   *
   * @method each
   * @param {Function} callback
   * @param {Object} context
   */
  this.each = function() {
    this.nodeFactory.each.apply(this.nodeFactory, arguments);
  };
};

OO.initClass(Schema);

module.exports = Schema;
