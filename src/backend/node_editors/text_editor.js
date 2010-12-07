var TextEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    this.$content = this.$('div.content');
    
    editor.activate(this.$content);
    
    // Update node when editor commands are applied
    editor.bind('changed', function() {
      that.updateNode();
    });
    
    this.$content.unbind('keydown');
    this.$content.bind('keydown', function(event) {
      that.updateNode();
    });
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      app.editor.model.updateSelectedNode({
        content: that.$content.html()
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});
