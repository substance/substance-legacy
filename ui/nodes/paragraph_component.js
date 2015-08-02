'use strict';

var OO = require('../../basics/oo');
var Component = require('../Component');
var $$ = Component.$$;
var NodeComponent = require('./node_component');
var TextProperty = require('./text_property_component');

function Paragraph() {
  NodeComponent.apply(this, arguments);
}

Paragraph.Prototype = function() {

  this.getClassNames = function() {
    return "content-node paragraph";
  };

  this.render = function() {
    return $$(TextProperty, { path: [ this.props.node.id, "content"] });
  };
};

OO.inherit(Paragraph, NodeComponent);

module.exports = Paragraph;
