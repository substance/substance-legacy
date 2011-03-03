var DocumentEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    
    this.$node = $('#' + app.document.selectedNode.html_id + ' > h1.content').unbind();
    this.$lead = $('#' + app.document.selectedNode.html_id + ' #document_lead').unbind();
    
    function activateTitleEditor() {
      editor.activate(that.$node, {
        multiline: false,
        markup: false,
        placeholder: 'Enter Title'
      });
      editor.bind('changed', function() {
        that.updateNode({title: editor.content()});
      });
    }
    
    function activateLeadEditor() {
      editor.activate(that.$lead, {
        multiline: false,
        markup: false,
        placeholder: 'Enter lead'
      });
      editor.bind('changed', function() {
        that.updateNode({lead: editor.content()});
      });
    }
    
    that.$node.bind('click', activateTitleEditor);
    that.$lead.bind('click', activateLeadEditor);
    
    function makeSelection() {
      if (document.activeElement === that.$node[0]) {
        activateTitleEditor();
      } else {
        activateLeadEditor();
      }
    }
    makeSelection();
    return true;
  },
  
  updateNode: function(attrs) {
    app.document.updateSelectedNode(attrs);
    app.document.trigger('changed');
  }
});