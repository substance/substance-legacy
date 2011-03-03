var TextEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    this.$content = this.$('div.content');
    editor.activate(this.$content, {
      placeholder: 'Enter Text',
      controlsTarget: $('#document_actions')
    });
    // Update node when editor commands are applied
    editor.bind('changed', function() {
      that.updateNode();
    });
  },
  
  updateNode: function() {
    var that = this;
    setTimeout(function() {
      app.document.updateSelectedNode({
        content: editor.content()
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});
