// DocumentBrowser widget / used to select a document to load
var DocumentBrowser = Backbone.View.extend({
  events: {
    'click a.close-shelf': 'close'
  },
  
  initialize: function() {
    
  },

  close: function() {
    this.el.hide();
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('browse_documents', {
      documents: Documents.models.map(function(d) { return d.attributes })
    }));
  }
});