// DocumentView
// ---------------

var DocumentView = Backbone.View.extend({
  events: {
    
  },
  
  id: null,
  
  loadDocument: function(id) {
    var that = this;
    
    this.id = id;
    console.log(id);
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
      document: doc.data,
      created_at: new Date(doc.created_at).toDateString(),
      // updated_at: _.prettyDate(doc.get('updated_at')),
      // published_on: doc.get('published_on') ? new Date(doc.get('published_on')).toDateString() : null,
      unpublished: !doc.get('published_on')
    }));
    
    this.$('#document').html(new HTMLRenderer(doc).render());
  }
});
