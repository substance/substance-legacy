var $$ = React.createElement;

var ICONS_FOR_TYPE = {
  "error": "fa-exclamation-circle",
  "info": "fa-info",
  "progress": "fa-exchange",
  "success": "fa-check-circle",
};

// The Status Bar
// ----------------

var StatusBar = React.createClass({
  contextTypes: {
    notifications: React.PropTypes.object.isRequired
  },

  displayName: "StatusBar",

  getInitialState: function() {
    return {
      message: null
    };
  },

  componentDidMount: function() {
    var notifications = this.context.notifications;

    notifications.connect(this, {
      'messages:updated': this.handleNotificationUpdate
    });
  },

  handleNotificationUpdate: function(messages) {
    var currentMessage = messages.pop();
    this.setState({
      message: currentMessage
    });
  },

  render: function() {
    var message = this.state.message;
    var notificationsEl;

    var classNames = ["status-bar-component"];

    if (message) {
      classNames.push(message.type);

      notificationsEl = $$('div', {className: 'notifications'},
        $$("div", {
          className: "icon",
          dangerouslySetInnerHTML: {__html: '<i class="fa '+ICONS_FOR_TYPE[message.type]+'"></i>'}
        }),
        $$('div', {className: 'message'}, message.message)
      );
    } else {
      notificationsEl = $$('div');
    }

    return $$("div", {className: classNames.join(" ")},
      $$("div", {className: "document-status"}, this.props.doc.get('document').title),
      notificationsEl
    );
  }
});

module.exports = StatusBar;