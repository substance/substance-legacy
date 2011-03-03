var SectionEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    this.render();
    this.$node = $('#' + app.document.selectedNode.html_id + ' > .content').attr('contenteditable', true).unbind();

    editor.activate(this.$node, {
      multiline: false,
      markup: false
    });
    
    editor.bind('changed', function() {
      that.updateNode();
    });
  },
  
  updateNode: function(e) {
    var that = this;
    
    setTimeout(function() {
      app.document.updateSelectedNode({
        name: editor.content()
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_section', app.editor.model.selectedNode.data));
  }
});
