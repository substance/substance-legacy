var Showdown = require('../../../lib/showdown').Showdown;


// FrontendRenderer
// ---------------

var FrontendRenderer = function(root) {
  
  // Implement node types
  var renderers = {
    document: function(node) {
      var content = '';
      content += '<h1>'+ node.title +'</h1>';
      node.children.forEach(function(child) {
        content += renderers[root.nodes[child].type](root.nodes[child]);
      });
      return content;
    },
    
    section: function(node) {
      var content = '';
      
      content += '<h2>' + node.name + '</h2>';
      node.children.forEach(function(child) {
        content += renderers[root.nodes[child].type](root.nodes[child]);
      });
      return content;
    },
    
    text: function(node) {
      var converter = new Showdown.converter();
      return converter.makeHtml(node.content);
    },
    
    image: function(node) {
      return '<image src="'+node.url+'"/>';
    }
  };

  return {
    render: function() {
      // Traverse the document

      return renderers['document'](root);
    }
  };
};

exports['Renderer'] = FrontendRenderer;
