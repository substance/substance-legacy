var QuoteEditor = Backbone.View.extend({
  events: {
    
  },
  
  initialize: function() {
    var that = this;

    this.$content = this.$('.quote-content').unbind();
    this.$author = this.$('.quote-author').unbind();
    
    function makeSelection() {
      if (document.activeElement === that.$author[0]) {
        if (that.$author.hasClass('empty')) {
          that.$author.html('');
          _.fullSelection(that.$author[0]);
        }
      } else {
        if (that.$content.hasClass('empty')) {
          that.$content.html('');
          _.fullSelection(that.$content[0]);
        }
      }
    }
    
    makeSelection();
    this.$content.bind('focus', makeSelection);
    this.$author.bind('focus', makeSelection);
    
    this.$content.bind('blur', function() {
      console.log('blurred from quote');
      that.updateState('$content');
    });
    
    this.$author.bind('blur', function() {
      console.log('blurred from Author');
      that.updateState('$author');
    });
    
    this.$content.unbind('keydown');
    this.$content.bind('keydown', function(e) {
      return e.keyCode !== 13 ? that.updateNode() : false;
    });
    
    this.$author.unbind('keydown');
    this.$author.bind('keydown', function(e) {
      return e.keyCode !== 13 ? that.updateNode() : false;
    });
  },
  
  updateState: function(property) {
    if (this[property].text().trim().length === 0) {
      if (property === '$content') {
        this[property].html('&laquo; Enter Quote &raquo;');
        app.document.updateSelectedNode({
          content: ""
        });
      } else {
        this[property].html('&laquo; Enter Author &raquo;');
        app.document.updateSelectedNode({
          author: ""
        });
      }
      this[property].addClass('empty');

    } else if (this[property].hasClass('empty') && this[property].text().trim().length > 0) {
      this[property].removeClass('empty');
    }
  },
  
  updateNode: function() {
    var that = this;
    
    setTimeout(function() {      
      var sanitizedQuote = that.$content.hasClass('empty') ? "" : _.stripTags(that.$content.html());
      var sanitizedAuthor = that.$author.hasClass('empty') ? "" : _.stripTags(that.$author.html());
      
      app.document.updateSelectedNode({
        content: sanitizedQuote,
        author: sanitizedAuthor
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});
