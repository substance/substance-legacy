var renderControls = function(node, first, last) {
  
  function render(node, destination, consolidate) {
    
    function computeActions(node) {
      var actions = [];

      // Possible children
      if (node.all('children').length === 0) {
        var children = ContentNode.types[node.type].allowedChildren;
        _.each(children, function(type) {
          actions.push({
            node: node.key,
            nodeType: type,
            insertionType: 'child'
          });
        });
      }

      // Possible siblings
      if (node.parent) {
        var siblings = ContentNode.types[node.parent.type].allowedChildren;
        _.each(siblings, function(type) {
          actions.push({
            node: node.key,
            nodeType: type,
            insertionType: 'sibling'
          });
        });
      }
      
      // Consolidate actions for child elements
      if (consolidate && node.all('children').length > 0) {
        actions = actions.concat(computeActions(node.all('children').last()));
      }
      
      return actions;
    }
  
    return Helpers.renderTemplate('controls', {
      node: node.key,
      destination: destination,
      actions: computeActions(node)
    });
  }
  
  // Top level
  if (!node.parent) {
    // Cleanup
    $('#document .controls').remove();
    
    if (node.all('children').length == 0) {
      $(render(node, 'before')).appendTo($('#'+node.key));
    }
  } else {
    //  Insert before, but only for starting nodes (first=true)
    if (first) {
      // Insert controls before node
      $(render(node, 'before')).insertBefore($('#'+node.key));
    }
    
    // Consolidate at level 1 (=section level), but only for closing nodes (last=true)
    if (node.parent.key === 'root') {
      $(render(node, 'after', true)).insertAfter($('#'+node.key));
    } else if (!last) {
      $(render(node,'after')).insertAfter($('#'+node.key));
    }
  }
  
  // Do the same for all children
  node.all('children').each(function(child, key, index) {
    var first = index === 0;
    var last = index === node.all('children').length-1;
    renderControls(child, first, last);
  });
};


// HTMLRenderer
// ---------------


var HTMLRenderer = function(root) {
  
  // Implement node types
  var renderers = {
    document: function(node) {
      var content = '';
      
      node.all('children').each(function(child, key, index) {
        content += renderers[child.type](child);
      });
      
      return Helpers.renderTemplate('document', {
        node: node,
        content: content
      });
    },
    
    section: function(node) {
      var content = '';
      
      node.all('children').each(function(child, key, index) { 
        content += renderers[child.type](child);
      });
      
      return Helpers.renderTemplate('section', {
        node: node,
        content: content
      });
    },
    
    text: function(node) {
      var converter = new Showdown.converter();
      
      return Helpers.renderTemplate('text', {
        node: node,
        content: converter.makeHtml(node.data.content)
      });
    },
    
    image: function(node) {
      return Helpers.renderTemplate('image', {
        node: node,
      });
    }
  };

  return {
    render: function() {
      // Traverse the document
      return renderers[root.type](root);
    }
  };
};