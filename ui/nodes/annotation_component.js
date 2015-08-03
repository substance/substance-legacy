"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

function AnnotationComponent() {
  Component.apply(this, arguments);
}

AnnotationComponent.Prototype = function() {

  this.render = function() {
    var el = $$('span', { "data-id": this.props.node.id, classNames: this.getClassNames() });
    if (this.props.node.active) {
      el.props.classNames += 'active';
    }
    return el.append(this.props.children);
  };

  this.getClassNames = function() {
    var typeNames = this.props.node.getTypeNames();
    var classNames = typeNames.join(' ');
    if (this.props.classNames) {
      classNames += " " + this.props.classNames.join(' ');
    }
    return classNames.replace(/_/g, '-');
  };

  this.didMount = function() {
    var node = this.props.node;
    node.connect(this, {
      'active': this.onActiveChanged
    });
  };

  this.willUnmount = function() {
    var node = this.props.node;
    node.disconnect(this);
  };

  this.onActiveChanged = function() {
    if (this.props.node.active) {
      this.$el.addClass('active');
    } else {
      this.$el.removeClass('active');
    }
  };
};

OO.inherit(AnnotationComponent, Component);

module.exports = AnnotationComponent;
