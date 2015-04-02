'use strict';

var Substance = require('substance');
var Data = require('../data');

var DocumentNode = Data.Node.extend({

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

});

module.exports = DocumentNode;
