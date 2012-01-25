s.views.ConfirmCollaboration = Backbone.View.extend({
  
  events: {
    "click a.option-tab": "selectOption",
    "submit #login-form": "login",
    "submit #signup-form": "register",
    "submit #confirm-form": "doConfirm"
  },
  
  initialize: function(tan) {
    var that = this;
  },
  
  selectOption: function(e) {
    var option = $(e.currentTarget).attr('option');
    this.$('.option').removeClass('active');
    this.$('.option-tab').removeClass('active');
    this.$('.option.'+option).addClass('active');
    this.$('.option-tab.'+option).addClass('active');
    return false;
  },
  
  doConfirm: function() {
    var that = this;
    this.confirm(function(err) {
      if (err) return alert('Collaboration could not be confirmed. '+err.error);
      window.location.href = "/"+that.model.document.get('creator')._id.split('/')[2]+"/"+that.model.document.get('name');
    });
    return false;
  },

  confirm: function(callback) {
    $.ajax({
      type: "POST",
      url: "/confirm_collaborator",
      data: {
        tan: this.model.tan,
        user: app.username
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return callback({error: res.error});
        callback(null);
      },
      error: function(err) {
        callback({error: "Error occurred"});
      }
    });
  },
  
  login: function(e) {
    var that = this;
    login(this.$('.username').val(), this.$('.password').val(), function (err) {
      if (err) return notifier.notify(Notifications.AUTHENTICATION_FAILED);
      that.confirm(function(err) {
        if (err) return alert('Collaboration could not be confirmed. '+err.error);
        window.location.href = "/"+that.model.document.get('creator')._id.split('/')[2]+"/"+that.model.document.get('name');
      });
    });
    return false;
  },
  
  register: function() {
    var that = this;
    $('.page-content .input-message').empty();
    $('#registration_error_message').empty();
    $('.page-content input').removeClass('error');
    
    createUser($('#signup_user').val(), $('#signup_name').val(), $('#signup_email').val(), $('#signup_password').val(), function (err, res) {
      if (err) {
        if (res.field === "username") {
          $('#signup_user').addClass('error');
          $('#signup_user_message').html(res.message);
        } else {
          $('#registration_error_message').html(res.message);
        }
      } else {
        notifier.notify(Notifications.AUTHENTICATED);
        window.location.href = "/"+res.username;
      }
    });
    return false;
  },
  
  render: function() {
    // Forward to document if authorized.
    var user = this.model.collaborator.get('user');
    if (user && user._id === "/user/"+app.username) {
      window.location.href = "/"+this.document.get('creator')._id.split('/')[2]+"/"+this.document.get('name');
      return;
    }    
    $(this.el).html(s.util.tpl('confirm_collaboration', this.model));
    return this;
  }
});
