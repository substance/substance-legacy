var VisualizationEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    // Update node when editor commands are applied
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      app.document.updateSelectedNode({
        content: that.$content.html()
      });
    }, 5);
  },
  
  render: function() {
    // this.$('.node-editor-placeholder').html(Helpers.renderTemplate('edit_visualization', app.editor.model.selectedNode.data));
  }
});
