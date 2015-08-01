"use strict";

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

class StatusBar extends Component {

  didMount: function() {
    var notifications = this.context.notifications;
    notifications.connect(this, {
      'messages:updated': this.handleNotificationUpdate
    });
  }

  render: function() {
    var message = this.state.message;
    var notifications;
    var classNames = ["status-bar-component fill-light"];
    if (message) {
      classNames.push(message.type);
      notifications = $$('div', {className: 'notifications'},
        $$("div", { classNames: "icon"},
          $$('i', { classNames: 'fa '+ICONS_FOR_TYPE[message.type]})
        ),
        $$('div', {classNames: 'message'}, message.message)
      );
    } else {
      notifications = $$('div');
    }
    return $$("div", { classNames: classNames.join(" ") },
      $$("div", { classNames: "document-status" }, this.props.doc.getDocumentMeta().title),
      notifications
    );
  }

  handleNotificationUpdate: function(messages) {
    var currentMessage = messages.pop();
    this.setState({
      message: currentMessage
    });
  }

}

module.exports = StatusBar;
