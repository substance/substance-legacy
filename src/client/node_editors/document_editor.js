var DocumentEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    
    this.$node = $('#' + app.document.selectedNode.html_id + ' > h1.content').unbind();
    this.$lead = $('#' + app.document.selectedNode.html_id + ' #document_lead').unbind();
    
    function makeSelection() {
      if (document.activeElement === that.$node[0]) {
        if (that.$node.hasClass('empty')) {
          that.$node.html('');
          _.fullSelection(that.$node[0]);
        }
      } else {
        if (that.$lead.hasClass('empty')) {
          that.$lead.html('');
          _.fullSelection(that.$lead[0]);
        }
      }
    }
    
    makeSelection();
    this.$node.bind('focus', makeSelection);
    this.$lead.bind('focus', makeSelection);
    
    this.$node.bind('blur', function() {
      that.updateState('$node');
    });
    
    this.$lead.bind('blur', function() {
      that.updateState('$lead');
    });
    
    this.$node.unbind('keydown');
    this.$node.bind('keydown', function(e) {
      return e.keyCode !== 13 ? that.updateNode() : false;
    });
    this.$lead.unbind('keydown');
    this.$lead.bind('keydown', function(e) {
      return e.keyCode !== 13 ? that.updateNode() : false;
    });
    return true;
  },
  
  updateState: function(property) {
    if (this[property].text().trim().length === 0) {
      if (property === '$node') {
        this[property].html('&laquo; Enter Title &raquo;');
        app.document.updateSelectedNode({
          title: ""
        });
      } else {
        this[property].html('&laquo; Enter Lead &raquo;');
        app.document.updateSelectedNode({
          lead: ""
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
      var sanitizedTitle = that.$node.hasClass('empty') && document.activeElement !== that.$node[0] ? "" : _.stripTags(that.$node.html());      
      var sanitizedLead = that.$lead.hasClass('empty') && document.activeElement !== that.$lead[0] ? "" : _.stripTags(that.$lead.html());
      
      app.document.updateSelectedNode({
        title: sanitizedTitle,
        lead: sanitizedLead
      });
      
      app.document.trigger('changed');
    }, 5);
  }
});