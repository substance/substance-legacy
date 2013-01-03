sc.views.Collaborators = Backbone.View.extend({

  // Events
  // ------

  events: {

  },

  // Handlers
  // --------

  initialize: function() {

  },

  render: function () {
    this.$el.html(_.tpl('document_collaborators', {}));
    return this;
  }
});