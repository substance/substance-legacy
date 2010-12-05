var Dashboard = Backbone.View.extend({
  
  loaded: false,
  
  initialize: function() {
    
  },
  
  load: function() {
    var that = this;
    
    notifier.notify(Notifications.DOCUMENTS_LOADING);
    
    // Call the remote for all documents
    this.data = {
      documents: [] // A list of documents to choose from
    };
    
    remote.Document.allAsGraph({
      success: function(documents) {
        that.data.documents = new Data.Graph(documents);
        that.loaded = true;
      
        // Start the browser
        that.browser = new DocumentBrowser({
          el: that.$('#document_browser'),
          model: that.data.documents
        });
        
        notifier.notify(Notifications.DOCUMENTS_LOADED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENTS_LOADING_FAILED);
      }
    });
  },
  
  render: function() {    
    // Render the stuff
    $(this.el).html(Helpers.renderTemplate('dashboard', {}));
    
    // Populate the document browser
    if (!this.loaded) {
      this.load();
    }
  }
});