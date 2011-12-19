s.views.RecoverPassword = Backbone.View.extend({

  events: {
    'submit form': 'requestReset'
  },

  requestReset: function (e) {
    var username = $('#username').val();
    requestPasswordReset(username, _.bind(function (err, res) {
      if (err) {
        $('#registration_error_message').html('Username does not exist.');
      } else {
        $('.recover').hide();
        $('.success').show();
      }
    }, this));
    return false;
  },

  render: function () {
    $(this.el).html(s.util.tpl('recover_password', {}));
    return this;
  }

});
