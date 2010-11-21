// nothing

var ApplicationController = Backbone.Controller.extend({
  routes: {
    'load/:document': 'loadDocument',
    'delete/:document': 'deleteDocument'
  },

  initialize: function(options) {
    this.app = options.app;
  },

  loadDocument: function(document) {
    this.app.loadDocument(document);
  },
  
  deleteDocument: function(document) {    
    var that = this;
    this.model = Documents.get(document);
    
    notifier.notify(Notifications.DOCUMENT_DELETING);
    
    this.model.destroy({
      success: function(model, response) {
        that.app.newDocument();
        notifier.notify(Notifications.DOCUMENT_DELETED);
      }, error: function() {
        notifier.notify(Notifications.DOCUMENT_DELETED);
      }
    });
  }

});