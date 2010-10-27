// Check for Node.js environment
// if (typeof exports !== 'undefined') {
//   var fs = require('fs'),
//       path = require('path');
//   require('./unveil');
// }


// ContentNode
// -----------------------------------------------------------------------------

var ContentNode = function(g, key, data) {
  uv.Node.call(this);
  
  this.g = g;
  this.key = key;
  
  // Node is expectd to have a type property
  this.type = data.type;
  
  // Memoize raw data for the build process
  this.data = data;
};

ContentNode.prototype = uv.inherit(uv.Node);

ContentNode.prototype.build = function() {
  var that = this;
  
  // Init children relationship
  this.replace('children', new uv.SortedHash());
  
  if (that.data.children) {
    // register children
    uv.each(that.data.children, function(nodeId) {
      // Find referenced node
      var n = that.g.get('nodes', nodeId);
      
      if (!n) {
        throw 'node '+key+' not found at document';
      }
      
      that.set('children', nodeId, n);
      
      // Register parent
      n.parent = that;
    });
  }
};

ContentNode.prototype.serialize = function() {
  return this.data;
};

ContentNode.prototype.addChild = function(node) {
  that.set('children', node.key, node);
};


// ContentGraph
// -----------------------------------------------------------------------------

var ContentGraph = function(g) {
  var that = this;
  uv.Node.call(this);
  
  this.type = 'document';
  this.data = g;
  
  // Register ContentNodes
  uv.each(g.nodes, function(node, key) {
    that.set('nodes', key, new ContentNode(that, key, node));
  });

  // Register direct children
  uv.each(g.children, function(nodeId) {
    // Get referenced node
    var n = that.get('nodes', nodeId);
    
    if (!n) {
      throw 'node '+key+' not found at document';
    }
    that.set('children', nodeId, n);
  });
  
  // Now that all nodes are registered we can build them
  this.all('nodes').each(function(index, r) {
    r.build();
  });
};

ContentGraph.prototype = uv.inherit(uv.Node);

ContentGraph.prototype.serialize = function() {
  var result = {
    title: this.data.title,
    nodes: {}
  };

  this.all('nodes').eachKey(function(key, node) {
    result.nodes[key] = node.serialize();
  });
  
  return result;
};


// HTMLRenderer
// =============================================================================
// This is just a stub, eventually we'll use a template engine here.

var HTMLRenderer = function(root) {
  
  // Implement node types
  var renderers = {
    document: function(node) {
      var str = '<h1>' + node.data.title + '</h1>';
      
      node.all('children').each(function(index, node) {
        str += renderers[node.type](node);
      });

      str += '</div>';
      return str;
    },
    section: function(node) {
      // var str = '<h'+(this.level+1)+' id="section_'+this.sectionId+'">'+this.val+'</h'+(this.level+1)+'>';
      var str = '<div id="'+node.key+'" class="content-node"><div class="content-node-info">Section</div><h2>'+node.data.name+'</h2>';
      
      node.all('children').each(function(index, node) {
        str += renderers[node.type](node); // node.render();
      });
      
      str += "</div>";
      return str;
    },
    paragraph: function(node) {
      var str = '<div id="'+node.key+'" class="content-node"><div class="content-node-info">Paragraph</div><p>';
      
      var converter = new Showdown.converter();
      
      str += converter.makeHtml(node.data.content);
      // node.all('children').each(function(index, node) {
      //   str += renderers[node.type](node); // node.render();
      //   
      // });
      
      str += '</p></div>';
      return str;
    } // ,
    // text: function(node) {
    //   var str = '<div id="'+node.key+'" class="content-node"><div class="content-node-info">Text</div>';
    //   
    //   if (node.data.em_level == 1) {
    //     str += '<em>';
    //   }
    //   if (node.data.em_level == 2) {
    //     str += '<strong>';
    //   }
    //   
    //   str += node.data.content;
    //   
    //   if (node.data.em_level == 1) {
    //     str += '</em>';
    //   }
    //   if (node.data.em_level == 2) {
    //     str += '</strong>';
    //   }
    //   
    //   str += '</div>';
    //   return str;
    // }
  };
  
  return {
    render: function() {
      // Traverse the document
      return renderers[root.type](root);
    }
  };
};


// Exports (for Node.js environment)
// -----------------------------------------------------------------------------
// if (typeof exports !== 'undefined') {
//   exports.ContentGraph = ContentGraph;
// }