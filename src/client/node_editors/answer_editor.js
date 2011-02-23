var AnswerEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    this.$content = this.$('.content');
    editor.activate(this.$content);
    $('.proper-commands').hide(); // Quickfix
    
    // Make selection    
    if (this.$content.hasClass('empty')) {
      this.$content.html('');
      _.fullSelection(this.$content[0]);
    };
    
    // Update node when editor commands are applied
    editor.bind('changed', function() {
      that.updateNode();
    });
    
    this.$content.bind('blur', function() {
      that.updateState();
      that.$content.unbind('blur');
    });
  },
  
  updateState: function() {
    if (this.$content.text().trim().length === 0) {
      this.$content.html('&laquo; Enter Answer &raquo;');
      this.$content.addClass('empty');
      app.document.updateSelectedNode({
        content: ""
      });
    } else if (this.$content.hasClass('empty') && this.$content.text().trim().length > 0) {
      this.$content.removeClass('empty');
    }
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      app.document.updateSelectedNode({
        content: that.$content.html()
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});
