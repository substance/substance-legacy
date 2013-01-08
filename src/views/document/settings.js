sc.views.Settings = Backbone.View.extend({

  // Events
  // ------

  events: {

  },

  // Handlers
  // --------

  initialize: function() {

  },

  render: function () {
    this.$el.html(_.tpl('document_settings', {
      publications: store.listPublications(this.model.document.id)
    }));
    return this;
  }
});