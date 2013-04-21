sc.views.Testsuite = Backbone.View.extend({

  // Events
  // ------


  // Handlers
  // --------

  render: function () {
    this.$el.html(_.tpl('testsuite', {

    }));

    return this;
  }
});