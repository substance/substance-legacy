'use strict';

var _ = require('../../basics/helpers');
var OO = require('../../basics/oo');

var Component = require('../component');
var $$ = Component.$$;
var Icon = require('../font_awesome_icon');

function ContextToggles() {
  Component.apply(this, arguments);

  this.onContextToggleClick = this.onContextToggleClick.bind(this);
}

ContextToggles.Prototype = function() {

  this.render = function() {
    var panelOrder = this.props.panelOrder;
    var contextId = this.props.contextId;

    var toggleComps = [];
    _.each(panelOrder, function(panelId) {
      var panelClass = this.context.componentRegistry.get(panelId);
      var classNames = ["toggle-context"];
      if (panelClass.contextId === contextId) {
        classNames.push("active");
      }
      var toggle = $$('a', {
          key: panelClass.contextId,
          classNames: classNames.join(" "),
          href: "#",
          "data-id": panelClass.contextId,
        },
        $$(Icon, { icon: panelClass.icon }),
        $$('span', { classNames: 'label'}, panelClass.displayName)
      );
      toggleComps.push(toggle);
    }, this);

    return $$('div', { classNames: "context-toggles" }, toggleComps);
  };

  this.didMount = function() {
    this.$el.on('click', 'a.toggle-context', this.onContextToggleClick);
  };

  this.willUnmount = function() {
    this.$el.off('click');
  };

  this.onContextToggleClick = function(e) {
    e.preventDefault();
    var newContext = $(e.currentTarget).attr("data-id");
    this.send('switchContext', newContext);
  };
};

OO.inherit(ContextToggles, Component);

module.exports = ContextToggles;
