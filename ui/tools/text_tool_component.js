"use strict";

var _ = require("../../basics/helpers");
var OO = require("../../basics/oo");
var Component = require('../component');
var $$ = Component.$$;

// Text Tool Component
// ----------------

function TextToolComponent() {
  Component.apply(this, arguments);
}

TextToolComponent.Prototype = function() {

  this.getInitialState = function() {
    return {
      disabled: true,
      open: false
    };
  };

  this.render = function() {
    var textTypes = this.tool.getAvailableTextTypes();

    var el = $$("div")
      .addClass('text-tool-component select');
    // Note: this is a view internal state for opening the select dropdown
    if (this.state.open) {
      el.addClass('open');
    }
    if (this.state.disabled) {
      el.addClass('disabled');
    }

    // label/dropdown button
    var isTextContext = textTypes[this.state.currentTextType];
    var label;
    if (isTextContext) {
      label = textTypes[this.state.currentTextType].label;
    } else if (this.state.currentContext) {
      label = this.state.currentContext; // i18n.t(this.state.currentContext);
    } else {
      label = 'No selection';
    }
    el.append($$('button')
      .addClass("toggle").attr('href', "#")
      .append(label)
      .on('click', this.handleClick)
      .on('mousedown', this.toggleAvailableTextTypes)
    );

    // dropdown options
    var options = $$('div').addClass("options shadow border fill-white");
    _.each(textTypes, function(textType, textTypeId) {
      var button = $$('button').key(textTypeId)
          .addClass('option '+textTypeId)
          .attr("data-type", textTypeId)
          .append(textType.label)
          .on('click', this.handleClick)
          .on('mousedown', this.handleSwitchTextType);
      options.append(button);
    }, this);

    return el;
  };

  this.didReceiveProps = function() {
    var toolName = this.props.tool;
    if (!toolName) {
      throw new Error('Prop "tool" is mandatory.');
    }
    this.tool = this.context.toolRegistry.get(toolName);
    if (!this.tool) {
      console.error('No tool registered with name %s', toolName);
    }
    this.tool.connect(this, {
      'toolstate:changed': this.onToolstateChanged
    });
  };

  this.willReceiveProps = function(newProps) {
    if (this.tool && newProps.tool !== this.tool.getName()) {
      this.tool.disconnect(this);
    }
  };

  this.willUnmount = function() {
    this.tool.disconnect(this);
  };

  this.onToolstateChanged = function(toolState) {
    this.setState(toolState);
  };

  this.handleClick = function(e) {
    e.preventDefault();
  };

  this.handleSwitchTextType = function(e) {
    e.preventDefault();
    this.tool.switchTextType(e.currentTarget.dataset.type);
  };

  this.toggleAvailableTextTypes = function(e) {
    e.preventDefault();
    if (this.tool.isDisabled()) return;
    // HACK: This only updates the view state state.open is not set on the tool itself
    // That way the dropdown automatically closes when the selection changes
    this.setState({
      open: !this.state.open
    });
  };
};

OO.inherit(TextToolComponent, Component);

module.exports = TextToolComponent;
