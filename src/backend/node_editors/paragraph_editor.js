var ParagraphEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
    this.$node = $('#' + app.editor.model.selectedNode.key + ' div.content');

    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(event) {
      that.updateNode();
    });
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      app.editor.model.updateSelectedNode({
        content: that.$node.html()
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_paragraph', app.editor.model.selectedNode.data));
  }
});
