'use strict';

var _ = require('../basics');
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

  toHtml: function(converter) {
    return this.constructor.static.toHtml(this, converter);
  },

});

Node.initNodeClass = Data.Node.initNodeClass;

// default HTML serialization
Node.static.toHtml = function(node, converter) {
  var $ = converter.$;
  var $el = $('<div itemscope>')
    .attr('data-id', node.id)
    .attr('data-type', node.type);
  _.each(node.properties, function(value, name) {
    var $prop = $('<div').attr('itemprop', name)
    if (node.getPropertyType === 'string') {
      $prop[0].appendChild(converter.annotatedText([node.id, name]));
    } else {
      $prop.text(value);
    }
    $el.append($prop);
  });
  return $el[0];
};

module.exports = Node;
