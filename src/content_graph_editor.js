var Helpers = {};

// Templates for the moment are recompiled every time
Helpers.renderTemplate = function(tpl, view, helpers) {
  source = $("script[name="+tpl+"]").html();
  var template = Handlebars.compile(source);
  return template(view, helpers || {});
};

var ContentNodeEditor = function(editor) {
  // Renders the node editor for the 
  // currently selected node and binds events.
  this.render = function() {
    // Call the right renderer
    ContentNodeEditor.widgets[editor.selectedNode.type](editor, editor.selectedNode);
    
    // TODO: Activate bespin editor
    // bespin.useBespin($('div.bespin')[0]);
  };
};

ContentNodeEditor.widgets = {};

var Editor = function(cg) {
  // Update ContentNode
  // ---------------------------------------------------------------------------
  // Populate the ContentNode editor with the selected node

  var that = this;
  var nodeEditor = new ContentNodeEditor(this);
  
  // Holds a reference to the currently selected node
  that.selectedNode = null;
  
  var renderNode = function(node) {
    // re-render node
    $('#'+node.key).replaceWith(new HTMLRenderer(node).render());
    // re-bind events
    bindEvents();
  };
  
  var updateContentNode = function(node) {
    // update node properties
    $('form#edit_node').serializeArray().forEach(function(prop) {
      node.data[prop.name] = prop.value;
    });
    
    renderNode(node);
  };
  
  var createEmptyNode = function(type) {
    var key = cg.generateId(); // Get a new unique NodeId
    
    // Create a node with default properties according
    // to the node type and attach it to the graph
    var data = {children: [], type: type};
    
    ContentNode.types[type].properties.forEach(function(p) {
      data[p.key] = p.defaultValue;
    });
    
    return new ContentNode(cg, key, data);
  };
  
  var selectContentNode = function(nodeId) {
    var node = cg.get('nodes', nodeId);
    var focused = false;
    
    // Unselect previously selected node
    if (that.selectedNode) $('#'+that.selectedNode.key).removeClass('selected');
    
    var $node = $('#'+node.key);
    $node.addClass('selected');
    that.selectedNode = node;
    
    $('#actions').css('left', $node.offset().left).css('top', $node.offset().top+$node.height());
    
    // init actions (context-based links and bind action events)
    $('#actions').html('<a href="#" type="paragraph" class="add_sibling">add paragraph</a> <a href="#" type="section" class="add_sibling">add section</a>');
    $('#actions a').click(function() {
      // Create node of a given type
      createSibling(that.selectedNode, $(this).attr('type'));
      return false;
    });
    
    // TODO: Use events for that
    // ContentNodeEditor needs to listen for node:selected event
    nodeEditor.render();
  };
  
  // Create a node of a given type
  var createSibling = function(predecessor, type) {
    var newNode = createEmptyNode(type);
    newNode.build();
    newNode.parent = predecessor.parent;
    
    // Attach to ContentGraph
    predecessor.parent.addChild(newNode, predecessor);
        
    renderNode(predecessor.parent);
    selectContentNode(newNode.key);
  };
  
  // Update ContentNode
  // ---------------------------------------------------------------------------
  // Apply changes made to the ContentNode to the ContentGraph
  
  var bindEvents = function() {
    // Reinit
    $('#content').unbind();
    
    $('#content div.content-node').mouseover(function() {
      $(this).addClass('active');
      return false;
    });
    
    $('#content div.content-node').mouseout(function() {
      $(this).removeClass('active');
      return false;
    });
    
    $('#content div.content-node').click(function() {
      selectContentNode($(this).attr('id'));
      return false;
    });
    
    // Save Document
    $('#save_document').click(function() {
      alert('persistence to couchdb is not implemented yet. However the the serialized DocumentGraph is alreaedy available. Click OK.');
      alert(JSON.stringify(cg.serialize()));
      return false;
    });
  };
  
  // Expose public interface
  that.init = function() {
    $('#content').html(new HTMLRenderer(cg).render());
    bindEvents();
  };
  
  that.updateContentNode = updateContentNode;
  that.save = function() {
    
  }
  return that;
};

$(function() {
  var cg = new ContentGraph(article_fixture);    
  
  // Init an editor instance by a given content_graph
  var editor = new Editor(cg);
  editor.init();  
});
