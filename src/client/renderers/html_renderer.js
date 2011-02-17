var renderControls = function(node, first, last, parent) {
  
  function render(node, destination, consolidate) {
    
    function computeActions(n, parent) {
      var actions = [];

      // Possible children
      if (n.all('children') && n.all('children').length === 0 && destination === 'after') {
        var children = n.properties().get('children').expectedTypes;
        
        _.each(children, function(type) {
          actions.push({
            node: n._id,
            parentNode: parent ? parent._id : null,
            nodeType: type,
            nodeTypeName: graph.get(type).name,
            insertionType: 'child'
          });
        });
      }

      // Possible siblings
      if (parent) {
        var siblings = parent.properties().get('children').expectedTypes;
        _.each(siblings, function(type) {
          actions.push({
            node: n._id,
            parentNode: parent ? parent._id : null,
            nodeType: type,
            nodeTypeName: graph.get(type).name,
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
      $(render(node, 'after')).appendTo($('#'+node.html_id));
    }
  } else {
    //  Insert before, but only for starting nodes (first=true)
    if (first) {
      // Insert controls before node
      $(render(node, 'before')).insertBefore($('#'+node.html_id));
    }
    
    // Consolidate at level 1 (=section level), but only for closing nodes (last=true)
    if (parent.types().get('/type/document')) {
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

var HTMLRenderer = function(root, parent) {
  
  // Implement node types
  var renderers = {
    "/type/document": function(node, parent) {
      var content = '',
          children = node.all('children');
      
      if (children) {
        children.each(function(child, key, index) {
          content += renderers[child.type._id](child, node);
        });        
      }
      
      return _.tpl('document', {
        node: node,
        content: content,
        edit: app.document.mode === 'edit',
        title: node.get('title'),
        lead: node.get('lead')
      });
    },
    
    "/type/story": function(node, parent) {
      return renderers["/type/document"](node, parent)
    },
    
    "/type/conversation": function(node, parent) {
      return renderers["/type/document"](node, parent)
    },
    
    "/type/article": function(node, parent) {
      return renderers["/type/document"](node, parent)
    },
    
    "/type/manual": function(node, parent) {
      return renderers["/type/document"](node, parent)
    },
    
    "/type/qaa": function(node, parent) {
      return renderers["/type/document"](node, parent)
    },
    
    "/type/section": function(node, parent) {
      var content = '',
          children = node.all('children');
      
      if (children) {
        node.all('children').each(function(child, key, index) { 
          content += renderers[child.type._id](child, node);
        });
      }
      
      return Helpers.renderTemplate('section', {
        node: node,
        parent: parent,
        content: content,
        edit: app.document.mode === 'edit',
        name: node.get('name')
      });
    },
    
    "/type/text": function(node, parent) {
      return Helpers.renderTemplate('text', {
        node: node,
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content')
      });
    },
    
    "/type/quote": function(node, parent) {
      return Helpers.renderTemplate('quote', {
        node: node,
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content')
      });
    },
    
    "/type/code": function(node, parent) {
      return Helpers.renderTemplate('code', {
        node: node,
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content')
      });
    },
    
    "/type/question": function(node, parent) {
      return Helpers.renderTemplate('question', {
        node: node,
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content')
      });
    },
    
    "/type/answer": function(node, parent) {
      return Helpers.renderTemplate('answer', {
        node: node,
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content')
      });
    },
    
    "/type/image": function(node, parent) {
      return Helpers.renderTemplate('image', {
        node: node,
        parent: parent,
        edit: app.document.mode === 'edit',
        url: node.get('url')
      });
    },
    
    "/type/visualization": function(node, parent) {
      return Helpers.renderTemplate('visualization', {
        node: node,
        parent: parent,
        edit: app.document.mode === 'edit',
        visualization_type: node.get('visualization_type'),
        data_source: node.get('data_source')
      });
    }
  };

  return {
    render: function() {
      // Traverse the document     
      return renderers[root.type._id](root, parent);
    }
  };
};


var TOCRenderer = function(root) {
  
  // Known node types
  var renderers = {
    "/type/document": function(node) {
      content = '<h2>Table of contents</h2>';
      content += '<ul>';
      node.all('children').each(function(child) {
        content += '<li><a class="toc-item" node="'+child.html_id+'" href="#'+root.get('creator')._id.split('/')[2]+'/'+root.get('name')+'/'+child.html_id+'">'+child.get('name')+'</a></li>';
      });
      content += '</ul>';
      return content;
    },
    
    "/type/story": function(node) {
      return renderers["/type/document"](node);
    },
    
    "/type/conversation": function(node) {
      return "";
    },
    
    "/type/manual": function(node, parent) {
      return renderers["/type/document"](node, parent)
    },
    
    "/type/article": function(node, parent) {
      return renderers["/type/document"](node, parent)
    },
    
    "/type/qaa": function(node, parent) {
      return renderers["/type/document"](node, parent)
    },
  };

  return {
    render: function() {
      // Traverse the document
      return renderers[root.type._id](root);
    }
  };
};