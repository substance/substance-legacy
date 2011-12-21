s.views.DocumentSettings = Backbone.View.extend({

  className: 'shelf-content',

  initialize: function () {},

  render: function () {
    $(this.el).html(s.util.tpl('document_settings', {}));
    this.trigger('resize');
    return this;
  },

  load: function (callback) { callback(null); },


  // Events
  // ------

  events: {
    'click .delete': 'deleteDocument'
  },

  deleteDocument: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocument(this.model, function (err) {
        router.navigate('', true); // TODO
      });
    }
  }

});
