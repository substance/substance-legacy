sc.views.Outline = Substance.View.extend({

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
  },

  dispose: function() {
    console.log('disposing outline view');
    this.disposeBindings();
  }
});