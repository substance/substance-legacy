// TOCRenderer
// ---------------


var TOCRenderer = function(root) {
  
  // Known node types
  var renderers = {
    document: function(node) {
      content = '<h2>Table of contents</h2>';
      content += '<ul>';
      node.all('children').each(function(child) {
        content += '<li><a href="#something">'+child.get('name')+'</a></li>';
      });
      content += '</ul>';
      return content;
    }
  };

  return {
    render: function() {
      // Traverse the document
      return renderers['document'](root);
    }
  };
};

var HTMLRenderer = function(root) {
  
  // Implemented node types
  var renderers = {
    document: function(node) {
      var content = '';
      // content += '<h1>'+ node.get('title') +'</h1>';

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
    
    quote: function(node) {
      return "<quote>"+node.get('content')+"</quote>";
    },
    
    code: function(node) {
      return '<pre class="code"><code>'+node.get('content')+'</code></pre>';
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