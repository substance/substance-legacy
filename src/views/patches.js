sc.views.Patches = Substance.View.extend({

  // Events
  // ------

  events: {
    
  },

  // Handlers
  // --------

  render: function () {
    this.$el.html(_.tpl('patches', this.model));
    return this;
  },
  dispose: function() {
    console.log('disposing editor...');
    this.disposeBindings();
  }

});