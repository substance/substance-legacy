  // Dashboard
  // ---------------

  var Dashboard = Backbone.View.extend({
    id: 'container',
    events: {
      'click .delete-document': '_deleteDocument',
    },

    _deleteDocument: function(e) {
      var docId = $(e.currentTarget).attr('data-id');
      session.deleteDocument(docId);
      this.render();
      return false;
    },

    render: function() {
      var documents = session.listDocuments();
      this.$el.html(_.tpl('dashboard', {
        documents: documents
      }));
      return this;
    }
  });