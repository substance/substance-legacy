sc.views.Outline = Backbone.View.extend({

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