// DocumentBrowser widget / used to select a document to load
var DocumentBrowser = Backbone.View.extend({
  events: {
    
  },
  
  initialize: function() {
    var that = this;
    
    // Load all documents available in the Repository
    // and render the DocumentBrowser
    
    notifier.notify(Notifications.DOCUMENTS_LOADING);
    
    // Call the remote for all documents
    this.documents = []; // A list of documents to choose from
    
    remote.Document.all({
      success: function(documents) {
        that.documents = documents;
        that.render();
        notifier.notify(Notifications.DOCUMENTS_LOADED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENTS_LOADING_FAILED);
      }
    });
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('browse_documents', {
      documents: this.documents
    }));
  }
});