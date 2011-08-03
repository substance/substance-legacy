var SectionEditor = Backbone.View.extend({
  
  initialize: function() {
    var that = this;
    this.render();
    this.$node = $('#' + app.document.selectedNode.html_id + ' > .content').attr('contenteditable', true).unbind();
    
    editor.activate(this.$node, {
      placeholder: 'Enter Section Name',
      multiline: false,
      markup: false
    });
    
    editor.bind('changed', function() {
      app.document.updateSelectedNode({
        name: editor.content()
      });
    });
  },
  
  render: function() {
  }
});
