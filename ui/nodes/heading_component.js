'use strict';

var OO = require('../../basics/oo');
var Component = require('../Component');
var $$ = Component.$$;
var NodeComponent = require('./node_component');
var TextProperty = require('./text_property_component');

function HeadingComponent() {
  NodeComponent.apply(this, arguments);
}

HeadingComponent.Prototype = function() {

  this.getClassNames = function() {
    return "content-node heading level-"+this.props.node.level;
  };

  this.render = function() {
    return $$(TextProperty, {
        doc: this.props.doc,
        path: [ this.props.node.id, "content"]
    });
  };
};

OO.inherit(HeadingComponent, NodeComponent);

module.exports = HeadingComponent;
