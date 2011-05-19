var Header = Backbone.View.extend({
  events: {
    'focus #login-user': 'focusUser',
    'blur #login-user': 'blurUser',
    'focus #login-password': 'focusPassword',
    'blur #login-password': 'blurPassword'
  },
  
  initialize: function(options) {
    
  },
  
  focusUser: function(e) {
    var input = $(e.currentTarget)
    if (input.hasClass('hint')) {
      input.val('');
      input.removeClass('hint');
    }
  },
  
  blurUser: function(e) {
    var input = $(e.currentTarget)
    if (input.val() === '') {
      input.addClass('hint');
      input.val('username');
    }
  },
  
  focusPassword: function(e) {
    var input = $(e.currentTarget)
    if (input.hasClass('hint')) {
      input.val('');
      input.removeClass('hint');
    }
  },
  
  blurPassword: function(e) {
    var input = $(e.currentTarget)
    if (input.val() === '') {
      input.addClass('hint');
      input.val('password');
    }
  },

  render: function() {
    var username = this.options.app.username;
    var notifications = graph.find({"type|=": "/type/notification", "recipient": "/user/"+username});

    var SORT_BY_DATE_DESC = function(v1, v2) {
      var v1 = v1.value.get('created_at'),
          v2 = v2.value.get('created_at');
      return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
    }
    
    notifications = notifications.sort(SORT_BY_DATE_DESC);
    
    // Render login-state
    $(this.el).html(_.tpl('header', {
      user: graph.get('/user/'+username),
      notifications: notifications,
      count: notifications.select(function(n) { return !n.get('read')}).length,
      notifications_active: this.notificationsActive
    }));
  }
});