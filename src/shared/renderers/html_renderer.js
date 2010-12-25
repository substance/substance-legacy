// HTMLRenderer
// ---------------

var HTMLRenderer = function(root) {
  
  // Implement node types
  var renderers = {
    document: function(node) {
      var content = '';
      content += '<h1>'+ node.get('title') +'</h1>';

      node.all('children').each(function(child) {
        content += renderers[child.type._id.split('/')[2]](child);
      });
      return content;
    },
    
    section: function(node) {
      var content = '';
      content += '<h2>' + node.get('name') + '</h2>';
      
      node.all('children').each(function(child) {
        content += renderers[child.type._id.split('/')[2]](child);
      });
      
      return content;
    },
    
    text: function(node) {
      return node.get('content');
    },
    
    image: function(node) {
      return '<image src="'+node.get('url')+'"/>';
    }
  };

  return {
    render: function() {
      // Traverse the document
      return renderers['document'](root);
    }
  };
};

if (exports) {
  exports['Renderer'] = HTMLRenderer;
}