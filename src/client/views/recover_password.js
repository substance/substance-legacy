s.views.RecoverPassword = Backbone.View.extend({
  events: {
    'submit form': 'requestReset'
  },
  
  requestReset: function() {
    var that = this;
    $.ajax({
      type: "POST",
      url: "/recover_password",
      data: {
        username: $('#username').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return $('#registration_error_message').html('Username does not exist.');
        $('.recover').hide();
        $('.success').show();
      },
      error: function(err) {
        $('#registration_error_message').html('Username does not exist.');
      }
    });
    return false;
  },
  
  render: function() {
    $(this.el).html(s.util.tpl('recover_password', {}));
    return this;
  }
});
