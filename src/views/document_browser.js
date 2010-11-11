// DocumentBrowser widget / used to select a document to load
var DocumentBrowser = Backbone.View.extend({
  events: {
    'click a.load_document': 'loadDocument'
  },
  
  initialize: function() {
    
  },
  
  loadDocument: function(e) {
    // Trigger a document load
    this.options.composer.loadDocument($(e.currentTarget).attr('key'));
    return false;
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('browse_documents', {
      documents: Documents.models.map(function(d) { return d.attributes })
    }));
  }
});