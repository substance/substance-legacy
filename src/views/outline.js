sc.views.Outline = Dance.Performer.extend({

  // Events
  // ------

  events: {

  },

  // Handlers
  // --------
  update: function() {

  },
  
  render: function () {
    this.$el.html(_.tpl('outline', this.model));
    return this;
  }
});