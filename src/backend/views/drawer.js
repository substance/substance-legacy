var Drawer = Backbone.View.extend({
  events: {
    'click .toggle a': 'toggle'
  },

  toggle: function(e) {
    $(this.el).parent().toggleClass('drawer-opened');
  },
  
  render: function() {
    var that = this;
    
    $(this.el).html(Helpers.renderTemplate('drawer', {}));
    
    // bind events manually since declarative events do not work here for some reason
    this.$('.toggle a').click(function(e) {
      that.toggle(e);
    });
  },
  
  renderNodeEditor: function() {
    // Depending on the selected node's type, render the right editor
    if (app.editor.model.selectedNode.type === 'document') {
      this.nodeEditor = new DocumentEditor({el: this.$('#drawer_content')});
    } else if (app.editor.model.selectedNode.type === 'paragraph') {
      this.nodeEditor = new ParagraphEditor({el: this.$('#drawer_content')});
    } else if (app.editor.model.selectedNode.type === 'section') {
      this.nodeEditor = new SectionEditor({el: this.$('#drawer_content')});
    } else if (app.editor.model.selectedNode.type === 'image') {
      this.nodeEditor = new ImageEditor({el: this.$('#drawer_content')});
    }
  }
});