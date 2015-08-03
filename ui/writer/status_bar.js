"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

var ICONS_FOR_TYPE = {
  "error": "fa-exclamation-circle",
  "info": "fa-info",
  "progress": "fa-exchange",
  "success": "fa-check-circle",
};

// The Status Bar
// ----------------

function StatusBar() {
  Component.apply(this, arguments);

  this.handleNotificationUpdate = this.handleNotificationUpdate.bind(this);
}

StatusBar.Prototype = function() {

  this.didMount = function() {
    var notifications = this.context.notifications;
    notifications.connect(this, {
      'messages:updated': this.handleNotificationUpdate
    });
  };

  this.willUpdateState = function() {
    if (this.state.message) {
      this.$el.removeClass(this.state.message.type);
    }
  };

  this.render = function() {
    var message = this.state.message;
    var notifications;
    if (message) {
      this.$el.addClass(message.type);
      notifications = $$('div', {className: 'notifications'},
        $$("div", { classNames: "icon"},
          $$('i', { classNames: 'fa '+ICONS_FOR_TYPE[message.type]})
        ),
        $$('div', { classNames: 'message' }, message.message)
      );
    } else {
      notifications = $$('div');
    }
    return $$('div', {classNames: "status-bar-component fill-light"},
      $$("div", { classNames: "document-status" },
        this.props.doc.getDocumentMeta().title
      ),
      notifications
    );
  };

  this.handleNotificationUpdate = function(messages) {
    var currentMessage = messages.pop();
    this.setState({
      message: currentMessage
    });
  };

};

OO.inherit(StatusBar, Component);

module.exports = StatusBar;
