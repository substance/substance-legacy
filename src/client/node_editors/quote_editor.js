var QuoteEditor = Backbone.View.extend({
  events: {
    
  },
  
  initialize: function() {
    var that = this;

    this.$content = this.$('.quote-content').unbind();
    this.$author = this.$('.quote-author').unbind();
    
    function activateContentEditor() {
      editor.activate(that.$content, {
        multiline: false,
        markup: false,
        placeholder: 'Enter Quote'
      });
      editor.bind('changed', function() {
        that.updateNode({content: editor.content()});
      });
    }
    
    function activateAuthorEditor() {
      editor.activate(that.$author, {
        multiline: false,
        markup: false,
        placeholder: 'Enter Author'
      });
      editor.bind('changed', function() {
        that.updateNode({author: editor.content()});
      });
    }
    
    that.$content.bind('click', activateContentEditor);
    that.$author.bind('click', activateAuthorEditor);
    
    function makeSelection() {
      if (document.activeElement === that.$author[0]) {
        activateAuthorEditor();
      } else {
        activateContentEditor();
      }
    }
    
    makeSelection();
    return true;
  },
  
  updateNode: function(attrs) {
    app.document.updateSelectedNode(attrs);
    app.document.trigger('changed');
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});
