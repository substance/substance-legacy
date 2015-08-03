"use strict";

var OO = require('../basics/oo');
var Component = require('./component');
var $$ = Component.$$;

function DropdownComponent() {
  Component.apply(this, arguments);

  this.handleDropdownToggle = this.handleDropdownToggle.bind(this);
  this.handleClick = this.handleClick.bind(this);
}

DropdownComponent.Prototype = function() {

  this.getInitialState = function() {
    return {
      open: false
    };
  };

  // Note: It's important that all children tools are rendered (even if not shown)
  // because only that way we can keep the disabled states accurate
  this.render = function() {
    var classNames = ['dropdown'];
    if (this.props.classNames) {
      classNames = classNames.concat(this.props.classNames);
    }
    if (this.state.open) {
      classNames.push('open');
    }
    return $$('div', {classNames: classNames.join(' ')},
      $$('button', {
        title: this.props.title,
        classNames: 'toggle',
      }, this.props.label),
      $$('div', {classNames: 'options shadow border fill-white'}, this.props.children)
    );
  };

  this.didMount = function() {
    this.$el.on('mousedown', 'button.toggle', this.handleDropdownToggle);
    this.$el.on('click', 'button.toggle', this.handleClick);
  };

  this.willUnmount = function() {
    this.$el.off('mousedown', 'button.toggle', this.handleDropdownToggle);
    this.$el.off('click', 'button.toggle', this.handleClick);
  };

  // Prevent click behavior as we want to preserve the text selection in the doc
  this.handleClick = function(e) {
    e.preventDefault();
  };

  this.handleDropdownToggle = function(e) {
    e.preventDefault();
    var open = this.state.open;
    var self = this;
    if (open) return;
    this.setState({open: !this.state.open});
    setTimeout(function() {
      $(window).one('mousedown', function(e) {
        /*jshint unused: false */
        // e.preventDefault();
        // e.stopPropagation();
        self.close();
      });
    }, 0);
  };

  this.close = function() {
    this.setState({
      open: false
    });
  };
};

OO.inherit(DropdownComponent, Component);

module.exports = DropdownComponent;
