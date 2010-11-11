var SectionEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    this.render();
  },
  
  updateNode: function(e) {
    var that = this;
    
    setTimeout(function() {
      that.model.updateSelectedNode({
        name: $('#editor input[name=name]').val()
      });
    }, 5);
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('edit_section', this.model.selectedNode.data));
    this.$('input[name=name]').focus();
  }
});
