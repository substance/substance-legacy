// DocumentView
// ---------------

var DocumentView = Backbone.View.extend({
  events: {
    'click .toc-item': 'scrollTo'
  },
  
  id: null,
  
  load: function(username, docname, node) {
    var that = this;
    
    // Already loaded?
    if (this.username === username && this.docname == docname) {
      that.scrollTo(node);
    } else {
      function getDocumentId(g) {
        var id;
        _.each(g, function(node, key) {
          var types = _.isArray(node.type) ? node.type : [node.type];
          if (_.include(types, '/type/document')) id = key;
        });
        return id;
      };

      graph.fetch({creator: '/user/'+username, name: docname}, {expand: true}, function(err, g) {
        if (!err) {
          that.id = getDocumentId(g);
          if (that.id) {
            that.username = username;
            that.docname = docname;
            that.render();
            
            // Jump to node?
            that.scrollTo(node);
          }
        } else {
          alert('Document could not be found.');
        }
      });
    }
  },
  
  scrollTo: function(arg) {
    if (!arg) return;
    var offset = arg.currentTarget ? $('#'+$(arg.currentTarget).attr('node')).offset()
                                   : $('#'+arg).offset();
                                   
    offset ? $('html, body').animate({scrollTop: offset.top}, 'slow') : null;
    if (arg.currentTarget) controller.saveLocation($(arg.currentTarget).attr('href'));
    return false;
  },
  
  initialize: function(options) {
  },
  
  render: function() {
    if (this.id) {
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
  }
});
