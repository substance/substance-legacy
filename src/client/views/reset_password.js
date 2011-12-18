s.views.ResetPassword = Backbone.View.extend({
  events: {
    'submit form': 'resetPassword'
  },
  
  resetPassword: function() {
    if ($('#password').val() !== $('#password_confirmation').val()) {
      return alert('Password and confirmation do not match!');
    }
    
    var that = this;
    $.ajax({
      type: "POST",
      url: "/reset_password",
      data: {
        username: that.username,
        tan: that.tan,
        password: $('#password').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.status === "error") return $('#registration_error_message').html(res.message);
        window.location.href = "/"+that.username;
      },
      error: function(err) {
        $('#registration_error_message').html('Unknown error.');
      }
    });
    return false;
  },
  
  initialize: function(username, tan) {
    this.username = username;
    this.tan = tan;
    this.el = '#content_wrapper';
    this.render();
  },
  
  render: function() {
    $(this.el).html(s.util.tpl('reset_password', {}));
    return this;
  }
});
