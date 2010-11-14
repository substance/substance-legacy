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
    // Register children if there are some
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
  var result = _.extend({}, this.data);
  result.children = [];
  this.all('children').each(function(node, key, index) {
    result.children.push(key);
  });
  return result;
};

// Add child either to the end of the children list or after
// a given reference node
ContentNode.prototype.addChild = function(node, referenceNode, destination) {
  var that = this;
  
  if (referenceNode && destination === 'after') { // insert after referenceNode
    that.all('children').set(node.key, node, that.all('children').index(referenceNode.key)+1);
  } else if (referenceNode && destination === 'before') {
    that.all('children').set(node.key, node, 0);
  } else { // insert at the end
    that.set('children', node.key, node);
  }
  
  // The new node needs to be attached to ContentGraph's node map as well
  that.g.set('nodes', node.key, node);
};

ContentNode.prototype.removeChild = function(key) {
  this.all('children').del(key);
  
  // TODO: Also remove from g.all('nodes') when no longer referenced
};

// ContentGraph
// -----------------------------------------------------------------------------

var ContentGraph = function(g) {
  var that = this;
  uv.Node.call(this);
  
  this.type = 'document';
  this.data = g;
  this.g = this;
  
  this.key = 'root';
  
  this.nodeCount = g.nodeCount || 1000;
  
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
    
    n.parent = that;
  });
  
  // Now that all nodes are registered we can build them
  this.all('nodes').each(function(r, key, index) {
    r.build();
  });
};

ContentGraph.prototype = uv.inherit(ContentNode);

// Generates a unique id for new nodes
ContentGraph.prototype.generateId = function () {
  return this.nodeCount += 1;
};

// Serializes the current state to a JSON representation
ContentGraph.prototype.serialize = function() {
  var result = _.extend({}, this.data, {
    nodes: {},
    children: [],
    nodeCount: this.nodeCount    
  });
  
  this.all('children').each(function(node, key, index) {
    result.children.push(key);
  });

  this.all('nodes').each(function(node, key, index) {
    result.nodes[key] = node.serialize();
  });
  
  return result;
};

