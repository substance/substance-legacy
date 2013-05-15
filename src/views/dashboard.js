  // Dashboard
  // ---------------

  sc.views.Dashboard = Substance.View.extend({
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
    },

    dispose: function() {
      console.log('disposing dashboard view');
      this.disposeBindings();
    }

  });