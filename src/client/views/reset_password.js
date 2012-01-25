s.views.ResetPassword = Backbone.View.extend({

  events: {
    'submit form': 'resetPassword'
  },

  resetPassword: function (e) {
    var password     = this.$('#password').val()
    ,   confirmation = this.$('#password_confirmation').val();
    
    if (password !== confirmation) {
      alert("Password and confirmation do not match!");
      return;
    }

    resetPassword(this.username, this.tan, password, _.bind(function (err, res) {
      if (err) {
        $('#registration_error_message').html(err);
      } else {
        window.location.href = "/";
      }
    }, this));
    
    return false;
  },

  initialize: function (options) {
    this.username = options.username;
    this.tan      = options.tan;
  },

  render: function() {
    $(this.el).html(s.util.tpl('reset_password', {}));
    return this;
  }

});
