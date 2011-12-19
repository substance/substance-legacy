s.views.Signup = Backbone.View.extend({

  id: 'signup',
  className: 'page-content',

  events: {
    'submit form': 'registerUser'
  },

  render: function () {
    $(this.el).html(s.util.tpl('signup', {}));
    return this;
  },

  registerUser: function (e) {
    $('.page-content .input-message').empty();
    $('#registration_error_message').empty();
    $('.page-content input').removeClass('error');
    
    var user     = this.$('#signup_user').val()
    ,   name     = this.$('#signup_name').val()
    ,   email    = this.$('#signup_email').val()
    ,   password = this.$('#signup_password').val();
    
    createUser(user, name, email, password, function (err, res) {
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
        router.navigate(res.username);
      }
    });
    return false;
  }

});
