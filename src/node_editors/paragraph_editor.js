var ParagraphEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    this.render();
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      that.model.updateSelectedNode({
        content: $('#editor textarea[name=content]').val()
      });
    }, 5);
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('edit_paragraph', this.model.selectedNode.data));
    // Focus on textarea
    this.$('textarea[name=content]').focus();
  }
});