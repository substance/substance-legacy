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
    // Render login-state
    $(this.el).html(_.tpl('header', {
      username: this.options.app.username
    }));
  }
});