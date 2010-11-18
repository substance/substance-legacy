var ParagraphEditor = Backbone.View.extend({
  events: {
    // 'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    this.render();
    this.$node = $('#' + this.model.selectedNode.key + ' div.content');

    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(event) {
      that.updateNode();
    });
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      that.model.updateSelectedNode({
        content: that.$node.html()
      });
    }, 5);
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('edit_paragraph', this.model.selectedNode.data));
    // Focus on textarea
    // this.$('textarea[name=content]').focus();
  }
});
