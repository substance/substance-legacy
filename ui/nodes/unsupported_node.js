'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');

function UnsupportedNodeComponent() {
  Component.apply(this, arguments);
}

UnsupportedNodeComponent.Prototype = function() {

  this.render = function() {
    var rawJson = JSON.stringify(this.props.node.properties, null, 2);
    var props = {
      classNames: "content-node unsupported",
      "data-id": this.props.node.id,
      contentEditable: false
    };
    return $$('pre', props, rawJson);
  };
};

OO.inherit(UnsupportedNodeComponent, Component);

module.exports = UnsupportedNodeComponent;
