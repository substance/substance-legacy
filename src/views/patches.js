sc.views.Patches = Backbone.View.extend({

  // Events
  // ------

  events: {
    
  },

  // Handlers
  // --------

  render: function () {
    this.$el.html(_.tpl('patches', this.model));
    return this;
  }
});