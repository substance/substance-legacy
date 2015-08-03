'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var TextProperty = require('../text_property_component');

function Paragraph() {
  Component.apply(this, arguments);
}

Paragraph.Prototype = function() {

  this.getClassNames = function() {
    return "content-node paragraph";
  };

  this.render = function() {
    return $$('div', {classNames: "content-node paragraph", "data-id": this.props.node.id},
      $$(TextProperty, { doc: this.props.doc, path: [ this.props.node.id, "content"] })
    );
  };
};

OO.inherit(Paragraph, Component);

module.exports = Paragraph;
