sc.views.Console = Backbone.View.extend({

  // Events
  // ------


  // Handlers
  // --------

  render: function () {
    this.$el.html(_.tpl('console', {
      
    }));

    return this;
  }
});