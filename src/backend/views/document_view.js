// DocumentView
// ---------------

var DocumentView = Backbone.View.extend({
  events: {
    'mouseover .content-node': 'highlightNode',
    'mouseout .content-node': 'unhighlightNode',
    'click .content-node': 'selectNode',
    'click .node-actions .handle': 'showActions',
    
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
    app.model.bind('change:node', function(node) {
      that.renderNode(node);
      
      // Re-render outline on every node change
      $('#outline').html('');
      app.outline = new Outline(app.model);
      app.outline.render();
    });
        
    // $('#container').click(function(e) {
    //   that.reset();
    //   return true;
    // });
    
    // TODO: Select the document node on-init
    
    $(document).unbind('keyup');
    $(document).keyup(function(e) {
      if (e.keyCode == 27) { that.reset(); }     // esc
    });
  },
  
  // Reset to view mode (aka unselect everything)
  reset: function(noBlur) {
    if (app.model.selectedNode) {
      this.$('#' + app.model.selectedNode.key).removeClass('selected');
    }
    
    if (!noBlur) $('.content').blur();
    $('#document .node-actions .links').hide();
    
    app.model.selectedNode = null;
    $('#document').removeClass('edit-mode');
    $('#document').removeClass('insert-mode');
    return false;
  },
  
  dragStart: function(e) {
    var dt = e.originalEvent.dataTransfer,
        sourceKey = $(e.target).parent().attr('id'),
        node = app.model.get('nodes', sourceKey);
        
    dt.setData("Text", sourceKey);
    $('#document').addClass('structure-mode');
    
    this.draggedNode = node;
    
    // TODO: Hide useless placeholders
    $('#document .node-placeholder[node='+sourceKey+']').addClass('invisible');
    
    // Hide placeholder where the dragged type can't be placed
    $('.node-placeholder:not(.'+node.type+')').addClass('hidden');
    
    return true;
  },
  
  dragEnter: function(e) {
    if (!$(e.target).hasClass('node-placeholder')) return true;
    $(e.target).addClass('dragover');
    
    // TODO: Preview node-content?
    return false;
  },
  
  dragLeave: function(e) {
    if (!$(e.target).hasClass('node-placeholder')) return true;
    $(e.target).removeClass('dragover');
    return false;
  },
  
  dragOver: function(e) {
    // Allow drops within node-placeholder elements
    if (!$(e.target).hasClass('node-placeholder')) return true;      
    
    return false;
  },
  
  dragEnd: function() {
    $('#document').removeClass('structure-mode');
    $('#document .node-placeholder.hidden').removeClass('hidden');
  },
  
  drop: function(e) {
    var $target = $(e.target);
    $('#document').removeClass('structure-mode');
    $('#document .node-placeholder.hidden').removeClass('hidden');
    
    if (!$target.hasClass('node-placeholder')) return true;
    var dt = e.originalEvent.dataTransfer;
    
    // Move node to new position
    app.model.moveNode(dt.getData("Text"), $target.attr('node'), $target.parent().attr('destination'));
    
    // Broadcast move node command
    remote.Session.moveNode(dt.getData("Text"), $target.attr('node'), $target.parent().attr('destination'));
    
    e.stopPropagation();
    return false;
  },
  
  showActions: function(e) {
    this.reset();
    $(e.target).parent().parent().find('.links').show();
    // Enable insert mode
    $('#document').addClass('insert-mode');
    return false;
  },
  
  renderNode: function(node) {
    $('#'+node.key).replaceWith(new HTMLRenderer(node).render());
  },
  
  render: function() {
    $(this.el).html(new HTMLRenderer(app.model).render());
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
    this.reset(true);
    app.model.selectNode($(e.currentTarget).attr('id'));
    $(e.currentTarget).addClass('selected');
    $('#document').addClass('edit-mode');
    return false;
  },
  
  addChild: function(e) {
    app.model.createChild($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
    
    // Broadcast insert node command
    remote.Session.insertNode('child', $(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'), 'after');
    return true;
  },
  
  addSibling: function(e) {
    switch($(e.currentTarget).parent().parent().parent().parent().attr('destination')) {
      case 'before': 
        app.model.createSiblingBefore($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
        
        // Broadcast insert node command
        remote.Session.insertNode('sibling', $(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'), 'before');
      break;
      case 'after':
        app.model.createSiblingAfter($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
        
        // Broadcast insert node command
        remote.Session.insertNode('sibling', $(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'), 'after');
      break;
    }
    return false;
  },
  
  removeNode: function(e) {
    app.model.removeNode($(e.currentTarget).attr('node'));
    
    // Broadcast remove node command
    remote.Session.removeNode($(e.currentTarget).attr('node'));
    return false;
  }
});
