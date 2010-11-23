var DocumentEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    this.$node = $('#' + app.model.selectedNode.key + ' > .content');
    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(event) {
      that.updateNode();
    });
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      app.model.updateSelectedNode({
        title: that.$node.html(),
        publication_date: $('#editor input[name=publication_date]').val(),
        tags: $('#editor textarea[name=document_tags]').val()
      });
      app.trigger('document:changed');
    }, 5);
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('edit_document', app.model.selectedNode.data));
  }
});