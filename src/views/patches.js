sc.views.Patches = Dance.Performer.extend({

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