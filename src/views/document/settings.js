sc.views.Settings = Substance.View.extend({

  // Events
  // ------

  events: {

  },

  // Handlers
  // --------

  initialize: function() {

  },

  render: function () {
    this.$el.html(_.tpl('document_settings', {}));
    return this;
  },

  dispose: function() {
    console.log('disposing settings view');
    this.disposeBindings();
  }
});