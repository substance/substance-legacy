// DocumentBrowser widget / used to select a document to load
var DocumentBrowser = Backbone.View.extend({
  events: {
  },
  
  initialize: function() {
    
    var that = this;
    // Load all documents available in the Repository
    // and render DocumentBrowser View
    
    notifier.notify(Notifications.DOCUMENTS_LOADING);
    
    Documents.fetch({
      success: function() {
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
      documents: Documents.models.map(function(d) { return d.attributes })
    }));
  }
});