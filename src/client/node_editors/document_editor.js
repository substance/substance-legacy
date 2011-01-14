var DocumentEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    
    this.$node = $('#' + app.document.selectedNode.html_id + ' > h1.content').attr('contenteditable', true);
    this.$lead = $('#' + app.document.selectedNode.html_id + ' #document_lead').attr('contenteditable', true);
    
    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(event) {
      that.updateNode();
    });
    this.$lead.unbind('keydown');
    this.$lead.bind('keydown', function(event) {
      that.updateNode();
    });
  },
  
  updateNode: function() {
    var that = this;
    setTimeout(function() {
      var sanitizedTitle = _.stripTags(that.$node.html());

      // Update HTML with sanitized content
      that.$node.html(sanitizedTitle);
      
      var sanitizedLead = _.stripTags(that.$lead.html());

      // Update HTML with sanitized content
      that.$lead.html(sanitizedLead);
      
      app.document.updateSelectedNode({
        title: sanitizedTitle,
        lead: sanitizedLead
      });
      
      app.document.trigger('document:changed');
    }, 5);
  }
});