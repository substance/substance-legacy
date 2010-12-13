// DocumentView
// ---------------

var DocumentView = Backbone.View.extend({
  events: {
    
  },
  
  loadDocument: function(id) {
    var that = this;
    $.ajax({
      url: '/documents/'+id,
      dataType: 'json',
      success: function(document) {
        that.model = document;
        that.render();
        
        // Update shelf
        app.shelf.render();
        
        setTimeout(function() {
          app.toggleView('document');
        }, 200);
        
      },
      error: function() {
        alert('An error occured during fetching the document');
      }
    });
  },
  
  initialize: function(options) {
    this.loadDocument(options.id);
  },
  
  render: function() {
    var doc = this.model;
    $(this.el).html(Helpers.renderTemplate('document', {
      document: doc,
      created_at: new Date(doc.created_at).toDateString(),
      updated_at: _.prettyDate(doc.updated_at),
      published_on: doc.published_on ? new Date(doc.published_on).toDateString() : null,
      unpublished: !doc.published_on
    }));
    
    if (this.model) {
      this.$('#document').html(new HTMLRenderer(this.model).render());
    } else {
      this.$('#document').html('Loading');
    }
  }
});
