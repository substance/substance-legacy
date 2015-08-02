'use strict';

var OO = require('../../basics/oo');
var Component = require('../component');

function NodeComponent() {
  Component.apply(this, arguments);
}

NodeComponent.Prototype = function() {

  this.getAttributes = function() {
    return {
      "data-id": this.props.node.id
    };
  };

};

OO.inherit(NodeComponent, Component);

module.exports = NodeComponent;
