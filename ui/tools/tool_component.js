'use strict';

var OO = require("../../basics/oo");
var Component = require('../component');
var $$ = Component.$$;
var Tool = require('../../surface/tool');

// ToolComponent
// -------------

function ToolComponent() {
  Component.apply(this, arguments);
}

ToolComponent.Prototype = function() {

  this.getInitialState = function() {
    return {
      disable: true,
      active: false
    };
  };

  this.render = function() {
    var el = $$("button")
      .attr('title', this.props.title)
      .on('mousedown', this.onMouseDown)
      .on('click', this.onClick);
    if (this.state.disabled) {
      el.addClass('disabled');
    }
    if (this.state.active) {
      el.addClass('active');
    }
    el.append(this.children);
    return el;
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
