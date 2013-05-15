sc.views.Export = Substance.View.extend({

  // Events
  // ------

  events: {

  },

  // Handlers
  // --------

  initialize: function() {

  },

  render: function () {
    this.$el.html(_.tpl('document_export', {}));
    return this;
  },

  dispose: function() {
    console.log('disposing export view');
    this.disposeBindings();
  }
});