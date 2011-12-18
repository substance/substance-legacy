s.views.UserSettings = Backbone.View.extend({
  events: {
    'submit form': 'updateUser'
  },
  
  updateUser: function() {
    if (this.$('#user_password').val() === "" || this.$('#user_password').val() === this.$('#user_password_confirmation').val()) {
      $.ajax({
        type: "POST",
        url: "/updateuser",
        data: {
          username: this.$('#user_username').val(),
          name: this.$('#user_name').val(),
          email: this.$('#user_email').val(),
          password: this.$('#user_password').val(),
          website: this.$('#user_website').val(),
          company: this.$('#user_company').val(),
          location: this.$('#user_location').val()
        },
        dataType: "json",
        success: function(res) {
          if (res.status === 'error') {
            notifier.notify({
              message: 'An error occured. Check your input',
              type: 'error'
            });
          } else {
            graph.merge(res.seed);
            app.username = res.username;
            app.render();
            
            app.document.closeDocument();
            app.browser.load(app.query());

            app.browser.bind('loaded', function() {
              app.toggleView('browser');
            });

            router.navigate(app.username);
          }
        },
        error: function(err) {
          notifier.notify({
            message: 'An error occured. Check your input',
            type: 'error'
          });
        }
      });
    } else {
      notifier.notify({
        message: 'Password and confirmation do not match.',
        type: 'error'
      });
    }
    return false;
  },
  
  initialize: function() {
    
  },
  
  render: function() {
    $(this.el).html(s.util.tpl('user_settings', {
      user: graph.get('/user/'+app.username)
    }));
    return this;
  }
});
