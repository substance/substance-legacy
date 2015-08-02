'use strict';

var OO = require('../../basics/oo');
var Component = require('../Component');

function UnsupportedNodeComponent() {
  Component.apply(this, arguments);
}

UnsupportedNodeComponent.Prototype = function() {

  this.tagName = 'pre';

  this.classNames = "content-node unsupported";

  this.getAttributes = function() {
    return {
      "data-id": this.props.node.id,
      contentEditable: false
    };
  };

  this.render = function() {
    var rawJson = JSON.stringify(this.props.node.properties, null, 2);
    return rawJson;
  };
};

OO.inherit(UnsupportedNodeComponent, Component);

UnsupportedNodeComponent.displayName = "UnsupportedNodeComponent";

module.exports = UnsupportedNodeComponent;
