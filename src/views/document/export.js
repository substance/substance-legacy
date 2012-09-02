sc.views.Export = Dance.Performer.extend({

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
  }
});