var SectionEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    this.$node = $('#' + app.editor.model.selectedNode.key + ' > .content');
    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(event) {
      that.updateNode();
    });
  },
  
  updateNode: function(e) {
    var that = this;
    
    setTimeout(function() {
      app.editor.model.updateSelectedNode({
        name: that.$node.html()
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_section', app.editor.model.selectedNode.data));
  }
});
