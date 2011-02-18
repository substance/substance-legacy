var QuoteEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    this.$content = this.$('.quote-content');
    this.$author = this.$('.quote-author');
    
    editor.activate(that.$content);
    
    this.$author.unbind('keydown');
    this.$author.bind('keydown', function(e) {
      return e.keyCode !== 13 ? that.updateNode() : false;
    });

    $('.proper-commands').hide(); // Quickfix
    
    // Update node when editor commands are applied
    editor.bind('changed', function() {
      that.updateNode();
    });
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      app.document.updateSelectedNode({
        content: that.$content.html(),
        author: that.$author.html()
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});
