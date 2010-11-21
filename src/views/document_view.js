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
    this.model.bind('change:node', function(node) {
      that.renderNode(node);
    });
        
    $('#container').click(function(e) {
      that.reset();
      return true;
    });
    
    $(document).unbind('keyup');
    $(document).keyup(function(e) {
      if (e.keyCode == 27) { that.reset(); }     // esc
    });
  },
  
  // Reset to view mode (aka unselect everything)
  reset: function(noBlur) {
    if (this.model.selectedNode) {
      this.$('#' + this.model.selectedNode.key).removeClass('selected');
    }
    
    if (!noBlur) $('.content').blur();
    
    $('#document .node-actions .links').hide();
    
    this.model.selectedNode = null;
    $('#document').removeClass('edit-mode');
    $('#document').removeClass('insert-mode');
    return false;
  },
  
  dragStart: function(e) {
    var dt = e.originalEvent.dataTransfer,
        sourceKey = $(e.target).parent().attr('id'),
        node = this.model.g.get('nodes', sourceKey);
        
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
    this.model.moveNode(dt.getData("Text"), $target.attr('node'), $target.parent().attr('destination'));
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
    $(this.el).html(new HTMLRenderer(this.model.g).render());
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
    
    this.model.selectNode($(e.currentTarget).attr('id'));
    $(e.currentTarget).addClass('selected');
    
    $('#document').addClass('edit-mode');
    
    return false;
  },
  
  addChild: function(e) {
    this.model.createChild($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
    // return false;
    return true;
  },
  
  addSibling: function(e) {
    switch($(e.currentTarget).parent().parent().parent().parent().attr('destination')) {
      case 'before': 
        this.model.createSiblingBefore($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
      break;
      case 'after':
        this.model.createSiblingAfter($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
      break;
    }
    return false;
  },
  
  removeNode: function(e) {
    this.model.removeNode($(e.currentTarget).attr('node'));
    return false;
  }
});