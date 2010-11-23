var ParagraphEditor = Backbone.View.extend({
  events: {
    // 'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    this.render();
    this.$node = $('#' + app.model.selectedNode.key + ' div.content');

    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(event) {
      that.updateNode();
    });
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      app.model.updateSelectedNode({
        content: that.$node.html()
      });
    }, 5);
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('edit_paragraph', app.model.selectedNode.data));
  }
});
