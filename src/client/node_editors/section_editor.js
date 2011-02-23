var SectionEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    this.render();
    this.$node = $('#' + app.document.selectedNode.html_id + ' > .content').attr('contenteditable', true).unbind();

    // Make selection    
    if (this.$node.hasClass('empty')) {
      this.$node.html('');
      _.fullSelection(this.$node[0]);
    };

    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(e) {
      return e.keyCode !== 13 ? that.updateNode() : false;
    });
    
    this.$node.bind('blur', function() {
      that.updateState();
    });
  },
  
  updateState: function() {
    if (this.$node.text().trim().length === 0) {
      this.$node.html('&laquo; Enter Section Name &raquo;');
      this.$node.addClass('empty');
      app.document.updateSelectedNode({
        content: ""
      });
    } else if (this.$node.hasClass('empty') && this.$node.text().trim().length > 0) {
      this.$node.removeClass('empty');
    }
  },
  
  updateNode: function(e) {
    var that = this;
    
    setTimeout(function() {
      var sanitizedContent = _.stripTags(that.$node.html());
      // Update HTML with sanitized content
      app.document.updateSelectedNode({
        name: sanitizedContent
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_section', app.editor.model.selectedNode.data));
  }
});
