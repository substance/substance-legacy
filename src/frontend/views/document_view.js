// DocumentView
// ---------------

var DocumentView = Backbone.View.extend({
  events: {
  },
  
  id: null,
  
  loadDocument: function(id) {
    var that = this;
    
    this.id = id;
    graph.fetch({_id: id}, {expand: true}, function(err) {
      that.render();
    });
  },
  
  initialize: function(options) {
    this.loadDocument(options.id);
    app.toggleView('document');
  },
  
  render: function() {
    var doc = graph.get(this.id);
    
    $(this.el).html(Helpers.renderTemplate('document', {
      document: doc.toJSON(),
      created_at: new Date(doc.get('created_at')).toDateString(),
      // updated_at: _.prettyDate(doc.get('updated_at')),
      // published_on: doc.get('published_on') ? new Date(doc.get('published_on')).toDateString() : null,
      unpublished: !doc.get('published_on')
    }));
    
    this.$('#toc').html(new TOCRenderer(doc).render());
    this.$('#document_content').html(new HTMLRenderer(doc).render());
  }
});
