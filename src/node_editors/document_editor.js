var DocumentEditor = Backbone.View.extend({
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
        title: $('#editor input[name=document_title]').val(),
        publication_date: $('#editor input[name=publication_date]').val(),
        tags: $('#editor textarea[name=document_tags]').val()
      });
    }, 5);
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('edit_document', this.model.selectedNode.data));
    this.$('input[name=document_title]').focus();
  }
});