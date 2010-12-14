// DocumentView
// ---------------

var DocumentView = Backbone.View.extend({
  events: {
    'mouseover .content-node': 'highlightNode',
    'mouseout .content-node': 'unhighlightNode',
    'click .content-node': 'selectNode',
    'click .controls .handle': 'showActions',
    
    // Actions
    'click a.add_child': 'addChild',
    'click a.add_sibling': 'addSibling',
    'click a.remove-node': 'removeNode',
    'dragstart': 'dragStart',
    'dragend': 'dragEnd',
    'dragenter': 'dragEnter',
    'dragover': 'dragOver',
    'dragleave': 'dragLeave',
    'drop': 'drop'
  },
  
  initialize: function() {
    var that = this;
    
    // Bind Events
    
    app.editor.model.bind('change:node', function(node) {
      
      that.renderNode(node);
    });

    // TODO: Select the document node on-init
    
    $(document).unbind('keyup');
    $(document).keyup(function(e) {
      if (e.keyCode == 27) { that.reset(); }  // esc
      e.stopPropagation();
    });
  },
  
  // Reset to view mode (aka unselect everything)
  reset: function(noBlur) {
    if (!noBlur) $('.content').blur();
    
    app.editor.model.selectedNode = null;
    this.resetSelection()

    // Broadcast
    remote.Session.selectNode(null);
    return false;
  },
  
  resetSelection: function() {
    this.$('.content-node.selected').removeClass('selected');
    $('#document .controls.active').removeClass('active');
    
    $('#document').removeClass('edit-mode');
    $('#document').removeClass('insert-mode');
    $('.proper-commands').hide();
    
    // Reset node-editor-placeholders
    $('.node-editor-placeholder').html('');
  },
  
  renderNodeEditor: function(node) {
    var $node = $('#'+node.key);
    
    // Depending on the selected node's type, render the right editor
    if (app.editor.model.selectedNode.type === 'document') {
      this.nodeEditor = new DocumentEditor({el: $('#drawer_content')});
    } else if (app.editor.model.selectedNode.type === 'text') {
      this.nodeEditor = new TextEditor({el: $node});
    } else if (app.editor.model.selectedNode.type === 'section') {
      this.nodeEditor = new SectionEditor({el: $node});
    } else if (app.editor.model.selectedNode.type === 'image') {
      this.nodeEditor = new ImageEditor({el: $node});
    }
  },
  
  // dragStart: function(e) {
  //   var dt = e.originalEvent.dataTransfer,
  //       sourceKey = $(e.target).parent().attr('id'),
  //       node = app.model.get('nodes', sourceKey);
  //       
  //   dt.setData("Text", sourceKey);
  //   $('#document').addClass('structure-mode');
  //   
  //   this.draggedNode = node;
  //   
  //   // TODO: Hide useless placeholders
  //   $('#document .node-placeholder[node='+sourceKey+']').addClass('invisible');
  //   
  //   // Hide placeholder where the dragged type can't be placed
  //   $('.node-placeholder:not(.'+node.type+')').addClass('hidden');
  //   
  //   return true;
  // },
  // 
  // dragEnter: function(e) {
  //   if (!$(e.target).hasClass('node-placeholder')) return true;
  //   $(e.target).addClass('dragover');
  //   
  //   // TODO: Preview node-content?
  //   return false;
  // },
  
  // dragLeave: function(e) {
  //   if (!$(e.target).hasClass('node-placeholder')) return true;
  //   $(e.target).removeClass('dragover');
  //   return false;
  // },
  // 
  // dragOver: function(e) {
  //   // Allow drops within node-placeholder elements
  //   if (!$(e.target).hasClass('node-placeholder')) return true;      
  //   
  //   return false;
  // },
  // 
  // dragEnd: function() {
  //   $('#document').removeClass('structure-mode');
  //   $('#document .node-placeholder.hidden').removeClass('hidden');
  // },
  
  // drop: function(e) {
  //   var $target = $(e.target);
  //   $('#document').removeClass('structure-mode');
  //   $('#document .node-placeholder.hidden').removeClass('hidden');
  //   
  //   if (!$target.hasClass('node-placeholder')) return true;
  //   var dt = e.originalEvent.dataTransfer;
  //   
  //   // Move node to new position
  //   app.model.moveNode(dt.getData("Text"), $target.attr('node'), $target.parent().attr('destination'));
  //   
  //   // Broadcast move node command
  //   remote.Session.moveNode(dt.getData("Text"), $target.attr('node'), $target.parent().attr('destination'));
  //   
  //   e.stopPropagation();
  //   return false;
  // },
  
  showActions: function(e) {
    this.reset();
    
    $(e.target).parent().parent().addClass('active');
    
    // Enable insert mode
    $('#document').addClass('insert-mode');
    return false;
  },
  
  renderNode: function(node) {
    $('#'+node.key).replaceWith(new HTMLRenderer(node).render());
    // Render controls
    renderControls(app.editor.model);
  },
  
  render: function() {
    $(this.el).html(new HTMLRenderer(app.editor.model).render());
    // Render controls
    renderControls(app.editor.model);
  },
  
  highlightNode: function(e) {
    $(e.currentTarget).addClass('active');
    return false;
  },
  
  unhighlightNode: function(e) {
    $(e.currentTarget).removeClass('active');
    return false;
  },
  
  selectNode: function(e) {
    var key = $(e.currentTarget).attr('id');
    
    if (!app.editor.model.selectedNode || app.editor.model.selectedNode.key !== key) {
      app.editor.model.selectNode(key);
    }
    e.stopPropagation();
  },
  
  addChild: function(e) {
    app.editor.model.createChild($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
    
    // Broadcast insert node command
    remote.Session.insertNode('child', $(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'), 'after');
    return true;
  },
  
  addSibling: function(e) {
    switch($(e.currentTarget).parent().parent().attr('destination')) {
      case 'before': 
        app.editor.model.createSiblingBefore($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
        
        // Broadcast insert node command
        remote.Session.insertNode('sibling', $(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'), 'before');
      break;
      case 'after':
        app.editor.model.createSiblingAfter($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
        
        // Broadcast insert node command
        remote.Session.insertNode('sibling', $(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'), 'after');
      break;
    }
    return false;
  },
  
  removeNode: function(e) {
    app.editor.model.removeNode($(e.currentTarget).attr('node'));
    
    // Broadcast remove node command
    remote.Session.removeNode($(e.currentTarget).attr('node'));
    return false;
  }
});
