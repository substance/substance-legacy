  // Login screen
  // ---------------

  var Login = Backbone.View.extend({
    id: 'container',
    render: function() {
      this.$el.html(_.tpl('login'));
      return this;
    }
  });