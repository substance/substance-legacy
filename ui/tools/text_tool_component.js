"use strict";

var _ = require("../../basics/helpers");
var OO = require("../../basics/oo");
var Component = require('../component');
var $$ = Component.$$;

// Text Tool Component
// ----------------

function TextToolComponent() {
  Component.apply(this, arguments);

  this.handleClick = this.handleClick.bind(this);
  this.handleSwitchTextType = this.handleSwitchTextType.bind(this);
  this.toggleAvailableTextTypes = this.toggleAvailableTextTypes.bind(this);
}

TextToolComponent.Prototype = function() {

  this.getInitialState = function() {
    return {
      disabled: true,
      open: false
    };
  };

  this.render = function() {
    var classNames = ['text-tool-component', 'select'];
    var textTypes = this.tool.getAvailableTextTypes();

    // Note: this is a view internal state for opening the select dropdown
    if (this.state.open) classNames.push('open');
    if (this.state.disabled) classNames.push('disabled');

    var isTextContext = textTypes[this.state.currentTextType];
    var label;

    if (isTextContext) {
      label = textTypes[this.state.currentTextType].label;
    } else if (this.state.currentContext) {

      label = this.state.currentContext; // i18n.t(this.state.currentContext);
    } else {
      label = 'No selection';
    }

    var currentTextTypeEl = $$('button', {
        href: "#",
        className: "toggle",
        onMouseDown: this.toggleAvailableTextTypes,
        onClick: this.handleClick
      }, label);

    var availableTextTypes = [];
    availableTextTypes = _.map(textTypes, function(textType, textTypeId) {
      return $$('button', {
        key: textTypeId,
        className: 'option '+textTypeId,
        "data-type": textTypeId,
        onMouseDown: this.handleSwitchTextType,
        onClick: this.handleClick
      }, textType.label);
    }.bind(this));

    return $$("div", { className: classNames.join(' ')},
      currentTextTypeEl,
      $$('div', {className: "options shadow border fill-white"}, availableTextTypes)
    );
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
  }

  this.didMount = function() {
    this.$el.on('click', '.toggle', this.handleClick);
    this.$el.on('mousedown', '.toggle', this.toggleAvailableTextTypes);
    this.$el.on('click', '.option', this.handleClick);
    this.$el.on('mousedown', '.option', this.handleSwitchTextType);
  };

  this.willUnmount = function() {
    this.tool.disconnect(this);
    this.$el.off('click', '.toggle', this.handleClick);
    this.$el.off('mousedown', '.toggle', this.toggleAvailableTextTypes);
    this.$el.off('click', '.option', this.handleClick);
    this.$el.off('mousedown', '.option', this.handleSwitchTextType);
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
