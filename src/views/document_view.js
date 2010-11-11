// DocumentView
// ---------------

var DocumentView = Backbone.View.extend({
  events: {
    'mouseover .content-node': 'highlightNode',
    'mouseout .content-node': 'unhighlightNode',
    'mouseover .node-placeholder': 'showActions',
    'mouseout .node-placeholder': 'hideActions',
    'click .content-node': 'selectNode',
    // Actions
    'click a.add_child': 'addChild',
    'click a.add_sibling': 'addSibling',
    'click a.remove_node': 'removeNode',
    'dragstart': 'dragStart',
    'dragend': 'dragEnd',
    'dragenter': 'dragEnter',
    'dragover': 'dragOver',
    'dragleave': 'dragLeave',
    'drop': 'drop'
  },
  
  dragStart: function(e) {
    var dt = e.originalEvent.dataTransfer,
        node = this.model.g.get('nodes', e.target.id);
    dt.setData("Text", e.target.id);
    
    $('#document').addClass('structure-mode');
    
    this.draggedNode = node;
    
    // TODO: Hide useless placeholders
    // $('#document .node-placeholder[node='+e.target.id+']').addClass('hidden');
    
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
    $('#document').removeClass('structure-mode');
    $('#document .node-placeholder.hidden').removeClass('hidden');
    
    if (!$(e.target).hasClass('node-placeholder')) return true;
    
    var dt = e.originalEvent.dataTransfer;
    $(e.target).html(dt.getData("Text")+" -> "+$(e.target).attr('node'));
    
    // Move node to new position
    this.model.moveNode(dt.getData("Text"), $(e.target).attr('node'));
    
    e.stopPropagation();
    return false;
  },
  
  initialize: function() {
    var that = this;
    
    // Bind Events
    this.model.bind('change:node', function(node) {
      that.renderNode(node);
    });
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
  
  showActions: function(e) {
    $(e.currentTarget).addClass('active');
    return false;
  },
  
  hideActions: function(e) {
    $(e.currentTarget).removeClass('active');
  },
  
  selectNode: function(e) {
    if (this.model.selectedNode) {
      this.$('#' + this.model.selectedNode.key).removeClass('selected');
    }
    this.model.selectNode($(e.currentTarget).attr('id'));
    $(e.currentTarget).addClass('selected');
    return false;
  },
  
  addChild: function(e) {
    this.model.createChild($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
    return false;
  },
  
  addSibling: function(e) {
    this.model.createSibling($(e.currentTarget).attr('type'), $(e.currentTarget).attr('node'));
    return false;
  },
  
  removeNode: function(e) {
    this.model.removeNode($(e.currentTarget).attr('node'));
    return false;
  }
});