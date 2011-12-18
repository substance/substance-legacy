s.views.Signup = Backbone.View.extend({

  events: {
    'submit #signup-form': 'registerUser'
  },

  render: function () {
    // TODO
    return this;
  },

  registerUser: function() {
    var that = this;
    
    $('.page-content .input-message').empty();
    $('#registration_error_message').empty();
    $('.page-content input').removeClass('error');
    
    createUser($('#signup_user').val(), $('#signup_name').val(), $('#signup_email').val(), $('#signup_password').val(), function(err, res) {
      if (err) {
        if (res.field === "username") {
          $('#signup_user').addClass('error');
          $('#signup_user_message').html(res.message);
        } else {
          $('#registration_error_message').html(res.message);
        }
      } else {
        graph.merge(res.seed);
        notifier.notify(Notifications.AUTHENTICATED);
        that.username = res.username;          
        window.location.href = "/"+res.username;
      }
    });
    return false;
  },
  
  logout: function (e) {
    logout(function () {
      window.location.reload();
    });
    return false;
  }

});
