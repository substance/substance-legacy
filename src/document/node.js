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
    var componentNames = this.constructor.static.components || [];
    if (componentNames.length === 0) {
      console.warn('Contract: a node must define its editable properties.');
    }
    return componentNames;
  },

  // Note: children are provided for inline nodes only.
  toHtml: function(converter, children) {
    return this.constructor.static.toHtml(this, converter, children);
  },

  // Node can be managed externally.
  // They are not removed from a document when the node
  // gets deleted by the user, but only removed from
  // the container.
  isExternal: function() {
    return !!this.constructor.static.external;
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
    var $prop = $('<div').attr('itemprop', name);
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
