var DocumentEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    
    this.$node = $('#' + app.editor.model.selectedNode.key + ' > .content');
    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(event) {
      that.updateNode();
    });
    
  },
  
  updateNode: function() {
    var that = this;
    setTimeout(function() {
      var sanitizedContent = _.stripTags(that.$node.html());

      // Update HTML with sanitized content
      that.$node.html(sanitizedContent);
      
      app.editor.model.updateSelectedNode({
        title: sanitizedContent
      });
      
      app.editor.trigger('document:changed');
    }, 5);
  }
});