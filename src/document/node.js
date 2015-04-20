'use strict';

var Data = require('../data');

var Node = Data.Node.extend({

  name: "node",

  attach: function( document ) {
    this.document = document;
  },

  detach: function() {
    this.document = null;
  },

  isAttached: function() {
    return this.document !== null;
  },

  getDocument: function() {
    return this.document;
  },

  hasParent: function() {
    return false;
  },

  getParentNode: function() {
    return this.document.get(this.parentId);
  },

  isResilient: function() {
    return false;
  },

  getComponents: function() {
    return this.constructor.static.components;
  },

});

Node.initNodeClass = Data.Node.initNodeClass;

module.exports = Node;
