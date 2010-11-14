// HTMLRenderer
// ---------------

var HTMLRenderer = function(root) {
  
  var renderControls = function(node, destination) {
    if (destination === 'after' || (node.parent && node.parent.all('children').index(node.key) === 0)) {
      return Helpers.renderTemplate('controls', {
        destination: destination,
        node: node,
        children: destination !== 'before' && node.all('children').length === 0 ? ContentNode.types[node.type].allowedChildren : [],
        siblings: node.parent ? ContentNode.types[node.parent.type].allowedChildren : [],
        allowedTypes: node.parent ? ContentNode.types[node.parent.type].allowedChildren.join(' ') : []
      });
    } else return '';
  };
  
  // Implement node types
  var renderers = {
    document: function(node) {
      var content = '';
      
      node.all('children').each(function(node, key, index) {
        content += renderControls(node, 'before');
        content += renderers[node.type](node);
        content += renderControls(node, 'after');
      });
      
      if (node.all('children').length === 0) {
        content += renderControls(node, 'after');
      }
      
      return Helpers.renderTemplate('document', {
        node: node,
        hasChildren: node.all('children').length > 0,
        content: content
        // allowedTypes: '',
        // controls: renderControls(node)
      });
    },
    
    section: function(node) {
      var content = '';
      
      node.all('children').each(function(node, key, index) { 
        content += renderControls(node, 'before');
        content += renderers[node.type](node);
        content += renderControls(node, 'after');
      });
      
      // TODO: ...index(node.key) is a performance killer
      return Helpers.renderTemplate('section', {
        node: node,
        firstNode: node.parent ? node.parent.all('children').index(node.key) === 0 : false,
        content: content
        // allowedTypes: ContentNode.types[node.parent.type].allowedChildren.join(' '),
        // controls: renderControls(node)
      });
    },
    
    paragraph: function(node) {
      var converter = new Showdown.converter();
      
      return Helpers.renderTemplate('paragraph', {
        node: node,
        firstNode: node.parent ? node.parent.all('children').index(node.key) === 0 : false,
        content: converter.makeHtml(node.data.content)
        // allowedTypes: ContentNode.types[node.parent.type].allowedChildren.join(' '),
        // controls: renderControls(node)
      });
    },
    
    image: function(node) {
      return Helpers.renderTemplate('image', {
        node: node,
        firstNode: node.parent ? node.parent.all('children').index(node.key) === 0 : false
        // allowedTypes: ContentNode.types[node.parent.type].allowedChildren.join(' '),
        // controls: renderControls(node)
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