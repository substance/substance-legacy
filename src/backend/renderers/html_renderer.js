// HTMLRenderer
// ---------------

var HTMLRenderer = function(root) {
  
  var renderControls = function(node, destination) {
    
    if (destination === 'after' || (node.parent && node.parent.all('children').index(node.key) === 0)) {
      
      var children = destination !== 'before' && node.all('children').length === 0 ? ContentNode.types[node.type].allowedChildren : [];
      var siblings = node.parent ? ContentNode.types[node.parent.type].allowedChildren : [];
      
      // Check for collapsed actions, in this case the node also takes over the actions of the parent node
      if (node.parent && node.parent.all('children').last() === node && destination === 'after') {
        var parentChildren = destination !== 'before' && node.parent.all('children').length === 0 ? ContentNode.types[node.parent.type].allowedChildren : [];
        var parentSiblings = node.parent.parent ? ContentNode.types[node.parent.parent.type].allowedChildren : [];
        // console.log(node.type+ ": "+destination+" is a collapsed node");
      }
      
      return Helpers.renderTemplate('controls', {
        destination: destination,
        node: node,
        children: children,
        siblings: siblings,
        parentChildren: parentChildren,
        parentSiblings: parentSiblings,
        allowedTypes: node.parent ? ContentNode.types[node.parent.type].allowedChildren.join(' ') : [],
      });
    } else return '';
  };
  
  // Implement node types
  var renderers = {
    document: function(node) {
      var content = '';
      
      if (node.all('children').length === 0) {
        // Empty document
        content += renderControls(node, 'after');
      } else {
        node.all('children').each(function(child, key, index) {
          content += renderControls(child, 'before');
          content += renderers[child.type](child);
          content += renderControls(child, 'after');
          // if (child.all('children').length === 0)
          //   content += renderControls(child, 'after');
          // else {
          //   console.log('meh');
          //   console.log(app.editor.model);
          //   content += "<div>"+child.type+" has "+child.all('children').length+" children</div>";
          // }
        });
      }
      
      return Helpers.renderTemplate('document', {
        node: node,
        hasChildren: node.all('children').length > 0,
        content: content
      });
    },
    
    section: function(node) {
      var content = '';
      
      node.all('children').each(function(child, key, index) { 
        content += renderControls(child, 'before');
        content += renderers[child.type](child);
        // if (child.all('children').length === 0)
        content += renderControls(child, 'after');
      });
      
      // TODO: ...index(node.key) is a performance killer
      return Helpers.renderTemplate('section', {
        node: node,
        content: content
      });
    },
    
    paragraph: function(node) {
      var converter = new Showdown.converter();
      
      return Helpers.renderTemplate('paragraph', {
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