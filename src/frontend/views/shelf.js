var Shelf = Backbone.View.extend({
  
  initialize: function() {
    
  },
  
  render: function() {
    var that = this;
    
    $(this.el).html(Helpers.renderTemplate('shelf', {
      documents: [], // Currently open documents
      document_opened: app.view === 'document',
      document: app.document ? app.document.model : null,
      username: app.username
    }));
  }
});
