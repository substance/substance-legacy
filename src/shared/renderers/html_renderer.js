// TOCRenderer
// ---------------


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
  };

  return {
    render: function() {
      // Traverse the document
      return renderers[root.type._id](root);
    }
  };
};

var HTMLRenderer = function(root) {
  
  // Implemented node types
  var renderers = {
    "/type/document": function(node) {
      var content = '';
      // content += '<h1>'+ node.get('title') +'</h1>';

      node.all('children').each(function(child) {
        content += renderers[child.type._id](child);
      });
      return content;
    },
    
    "/type/conversation": function(node) {
      return renderers["/type/document"](node);
    },
    
    "/type/story": function(node) {
      return renderers["/type/document"](node);
    },
    
    "/type/section": function(node) {
      var content = '';
      content += '<h2 id="'+node.html_id+'">' + node.get('name') + '</h2>';
      
      node.all('children').each(function(child) {
        content += renderers[child.type._id](child);
      });
      
      return content;
    },
    
    "/type/text": function(node) {
      return node.get('content');
    },
    
    "/type/question": function(node) {
      return '<p class="question">'+node.get('content')+'</p>';
    },
    
    "/type/answer": function(node) {
      return '<p class="answer">'+node.get('content')+'</p>';
    },
    
    "/type/quote": function(node) {
      return "<quote>"+node.get('content')+"</quote>";
    },
    
    "/type/code": function(node) {
      return '<pre class="code"><code>'+node.get('content')+'</code></pre>';
    },
    
    "/type/image": function(node) {
      return '<image src="'+node.get('url')+'"/>';
    }
  };

  return {
    render: function() {
      // Traverse the document
      return renderers[root.type._id](root);
    }
  };
};

if (exports) {
  exports['Renderer'] = HTMLRenderer;
}