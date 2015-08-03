'use strict';

var OO = require("../../basics/oo");
var Component = require('../component');
var $$ = Component.$$;
var Tool = require('../../surface/tool');

// ToolComponent
// -------------

function ToolComponent() {
  Component.apply(this, arguments);

  this.onMouseDown = this.onMouseDown.bind(this);
  this.onClick = this.onClick.bind(this);
}

ToolComponent.Prototype = function() {

  this.render = function() {
    var classNames = [];
    if (this.props.classNames) {
      classNames = this.props.classNames.slice();
    }
    if (this.state.disabled) {
      classNames.push('disabled');
    }
    if (this.state.active) {
      classNames.push("active");
    }
    return $$("button", {
      classNames: classNames.join(' '),
      title: this.props.title,
    }, this.props.children);
  };

  this.didMount = function() {
    var toolName = this.props.tool;
    if (!toolName) {
      throw new Error('Prop "tool" is mandatory.');
    }
    this.tool = this.context.toolRegistry.get(toolName);
    if (!this.tool) {
      console.warn('No tool registered with name %s', toolName);
      this.tool = new ToolComponent.StubTool(toolName);
    }
    // Derive initial state from tool
    this.state = this.tool.state;
    this.tool.connect(this, {
      'toolstate:changed': this.onToolstateChanged
    });
    this.$el.on('mousedown', this.onMouseDown);
    this.$el.on('click', this.onClick);
  };

  this.onToolstateChanged = function(toolState/*, tool, oldState*/) {
    this.setState(toolState);
  };

  this.onClick = function(e) {
    e.preventDefault();
  };

  this.onMouseDown = function(e) {
    e.preventDefault();
    if (this.state.disabled) {
      return;
    }
    this.tool.performAction();
  };
};

OO.inherit(ToolComponent, Component);

ToolComponent.StubTool = Tool.extend({

  init: function(name) {
    this.name = name;
  },

  performAction: function() {
    console.log('Stub-Tool %s', this.name);
  }
});

module.exports = ToolComponent;
