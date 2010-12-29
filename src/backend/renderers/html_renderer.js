var renderControls = function(node, first, last, parent) {
  
  function render(node, destination, consolidate) {
    
    function computeActions(n, parent) {
      var actions = [];

      // Possible children
      if (n.all('children') && n.all('children').length === 0) {
        var children = ContentNode.types[n.type.key].allowedChildren;
        _.each(children, function(type) {
          actions.push({
            node: n.key,
            nodeType: type,
            insertionType: 'child'
          });
        });
      }

      // Possible siblings
      if (parent) {
        var siblings = ContentNode.types[parent.type.key].allowedChildren;
        _.each(siblings, function(type) {
          actions.push({
            node: n.key,
            nodeType: type,
            insertionType: 'sibling'
          });
        });
      }
      
      // Consolidate actions for child elements
      if (consolidate && n.all('children') && n.all('children').length > 0) {
        actions = actions.concat(computeActions(n.all('children').last(), n));
      }
      
      return actions;
    }
  
    return Helpers.renderTemplate('controls', {
      node: node.key,
      destination: destination,
      actions: computeActions(node, parent)
    });
  }
  
  // Top level
  if (!parent) {
    // Cleanup
    $('#document .controls').remove();
    if (!node.all('children') || node.all('children').length === 0) {
      $(render(node, 'before')).appendTo($('#'+node.html_id));
    }
  } else {
    //  Insert before, but only for starting nodes (first=true)
    if (first) {
      // Insert controls before node
      $(render(node, 'before')).insertBefore($('#'+node.html_id));
    }
    
    // Consolidate at level 1 (=section level), but only for closing nodes (last=true)
    if (parent.type.key === '/type/document') {
      $(render(node, 'after', true)).insertAfter($('#'+node.html_id));
    } else if (!last) {
      $(render(node,'after')).insertAfter($('#'+node.html_id));
    }
  }
  
  if (node.all('children')) {
    // Do the same for all children
    node.all('children').each(function(child, key, index) {
      var first = index === 0;
      var last = index === node.all('children').length-1;
      renderControls(child, first, last, node);
    });
  }
};


// HTMLRenderer
// ---------------


var HTMLRenderer = function(root) {
  
  // Implement node types
  var renderers = {
    document: function(node) {
      var content = '',
          children = node.all('children');
      
      if (children) {
        children.each(function(child, key, index) {
          content += renderers[child.type._id.split('/')[2]](child);
        });        
      }
      
      return Helpers.renderTemplate('document', {
        node: node,
        content: content,
        title: node.get('title')
      });
    },
    
    section: function(node) {
      var content = '',
          children = node.all('children');
      
      if (children) {
        node.all('children').each(function(child, key, index) { 
          content += renderers[child.type._id.split('/')[2]](child);
        });
      }
      
      return Helpers.renderTemplate('section', {
        node: node,
        content: content,
        name: node.get('name')
      });
    },
    
    text: function(node) {
      return Helpers.renderTemplate('text', {
        node: node,
        content: node.get('content')
      });
    },
    
    image: function(node) {
      return Helpers.renderTemplate('image', {
        node: node,
        url: node.get('url')
      });
    }
  };

  return {
    render: function() {
      // Traverse the document
      return renderers[root.type._id.split('/')[2]](root);
    }
  };
};