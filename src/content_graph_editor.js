var Helpers = {};

// Templates for the moment are recompiled every time
Helpers.renderTemplate = function(tpl, view, helpers) {
  source   = $("script[name="+tpl+"]").html();
  var template = Handlebars.compile(source);
  
  return template(view, helpers || {});
};



var ContentNodeEditor = function(editor) {
  console.log('initialized contentnodeeditor instance');
  
  // Renders the node editor for the 
  // currently selected node and binds events.
  this.render = function() {
    // Call the right renderer
    ContentNodeEditor.widgets[editor.selectedNode.type](editor, editor.selectedNode);
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
  
  var createNode = function(parent, type) {
    // TODO: Generate a new content node of a given type
    var key = 2341;
    
    // Create a node with default properties according to the node type and attach it to the graph
    var data = {children: [], type: type};
    
    ContentNode.types[type].properties.forEach(function(p) {
      data[p.key] = p.defaultValue;
    });
    
    var newNode = new ContentNode(cg, key, data);
    newNode.build();
    newNode.parent = parent;
    
    parent.set('children', key, newNode);
    
    // The new node needs to be attached to ContentGraph's node map as well
    cg.set('nodes', key, newNode);
    
    renderNode(parent);
  };
  
  var selectContentNode = function(nodeId) {
    var node = cg.get('nodes', nodeId);
    var focused = false;
    
    // Unselect previously selected node
    if (that.selectedNode) $('#'+that.selectedNode.key).removeClass('selected');
    $('#'+node.key).addClass('selected');
    
    that.selectedNode = node;
    
    // TODO: Use events for that
    // ContentNodeEditor needs to listen for node:selected event
    nodeEditor.render();
  };
  
  var bindContentNodeEvents = function(target) {
    
  }
  
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
    
    // Add child
    $('#add_child').click(function() {
      if (selectedNode) {
        $('#editor').html($("script[name=add_node]").html());
      }
      
      // Insert child
      $('#insert_node').click(function() {
        // Create node of a given type
        createNode(selectedNode, $('#add_node select[name=type]').val());
      });
      
      return null;
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
