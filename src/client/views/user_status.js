s.views.UserStatus = Backbone.View.extend(_.extend({}, StateMachine, {

  id: 'user_status',

  events: {
    'click .logout': 'logout',
    'submit #login-form': 'login',
    
    'click .toggle.notifications': 'toggleNotifications',
    'click #event_notifications a .notification': 'hideNotifications'
  },

  initialize: function () {
    this.notificationsActive = false;
    this.state = session.username ? 'logged_in' : 'logged_out';
    
    setInterval(function() {
      loadNotifications(function () {});
    }, 30000);
  },

  transitionTo: function () {
    var r = StateMachine.transitionTo.apply(this, arguments);
    this.render();
    return r;
  },

  render: function () {
    $(this.el).html(this.invokeForState('render'));
    return this;
  },

  login: function (e) {
    var username = this.$('#login-user').val()
    ,   password = this.$('#login-password').val();
    
    login(username, password, function (err) {
      if (err) return notifier.notify(Notifications.AUTHENTICATION_FAILED);
      window.location.reload();
    });
    
    return false;
  },

  logout: function (e) {
    logout(_.bind(function (err) {
      if (!err) {
        this.transitionTo('logged_out');
      }
    }, this));
    
    return false;
  },

  // Triggered by toggleNotifications
  // Triggers markAllRead
  showNotifications: function() {
    $(this.el).addClass('notifications-active');
    this.notificationsActive = true;
  },
  
  // Triggered by toggleNotifications and when clicking a notification
  // Triggers count reset (to zero)
  hideNotifications: function() {
    // Mark all notifications as read
    var notifications = graph.find({"type|=": "/type/notification", "recipient": "/user/"+app.username});
    var unread = notifications.select(function(n) { return !n.get('read')});
    unread.each(function(n) {
      n.set({read: true});
    });
    
    $(this.el).removeClass('notifications-active');
    this.notificationsActive = false;
  },
  
  toggleNotifications: function (e) {
    if (this.notificationsActive) {
      this.hideNotifications();
    } else {
      this.showNotifications();
    }
    return false;
  }

}), {

  states: {
    logged_in: {
      render: function () {
        var notifications = getNotifications();
        
        return s.util.tpl('user_navigation', {
          notifications: notifications,
          user: currentUser(),
          count: notifications.select(function(n) { return !n.get('read')}).length,
          notifications_active: true
        });
      }
    },

    logged_out: {
      render: function () { return s.util.tpl('login_form'); }
    }
  }

});
