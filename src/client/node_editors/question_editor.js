var QuestionEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    this.$content = this.$('.content');
    
    editor.activate(this.$content, {
      multiline: false,
      markup: false
    });
    
    // Update node when editor commands are applied
    editor.bind('changed', function() {
      app.document.updateSelectedNode({
        content: editor.content()
      });
    });
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});
