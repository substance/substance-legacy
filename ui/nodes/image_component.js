'use strict';

var OO = require('../../basics/oo');
var Component = require('../Component');
var $$ = Component.$$;

function ImageComponent() {
  Component.apply(this, arguments);

  this.handleDocumentChange = this.handleDocumentChange.bind(this);
}

ImageComponent.Prototype = function() {

  this.didMount = function() {
    var doc = this.props.doc;
    doc.connect(this, { 'document:changed': this.handleDocumentChange });
  };

  this.willUnmount = function() {
    var doc = this.props.doc;
    doc.disconnect(this);
  };

  this.getClassNames = function() {
    return 'image';
  };

  this.getAttributes = function() {
    return {
      contentEditable: false,
      "data-id": this.props.node.id
    };
  };

  this.render = function() {
    return $$('img', {src: this.props.node.src});
  };

  this.handleDocumentChange = function(change) {
    if (change.isAffected([this.props.node.id, "src"])) {
      this.rerender();
    }
  };
};

OO.inherit(ImageComponent, Component);

module.exports = ImageComponent;
