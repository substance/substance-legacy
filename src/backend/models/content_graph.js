// ContentNode
// ---------------

var ContentNode = _.inherits(Data.Node, {
  constructor: function(g, key, data) {
    Data.Node.call(this);

    this.g = g;
    this.key = key;
    
    // Node is expectd to have a type property
    this.type = data.type;

    // Memoize raw data for the build process
    this.data = data;
  },
  
  build: function() {
    var that = this;
    
    // Init children relationship
    this.replace('children', new Data.Hash());

    if (that.data.children) {
      // Register children if there are some
      _.each(that.data.children, function(nodeId) {
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
    
  },

  serialize: function() {
    var result = _.extend({}, this.data);
    result.children = [];
    this.all('children').each(function(node, key, index) {
      result.children.push(key);
    });
    return result;
  },

  // Add child either to the end of the children list or after
  // a given reference node
  addChild: function(node, referenceNode, destination) {
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
  },

  removeChild: function(key) {
    this.all('children').del(key);
    this.g.all('nodes').del(key);
  }
});


// ContentGraph
// ---------------

var ContentGraph = _.inherits(ContentNode, {
  constructor: function(g) {    
    var that = this;
    Data.Node.call(this);

    this.type = 'document';
    this.data = {
      title: g.title
    };
    
    this.g = this;
    
    // if present
    this.id = g.id;
    this.name = g.name;
    this.author = g.author;
    
    // Meta-information that can be attached
    this.attributes = g.attributes || {};

    this.key = 'root';
    this.nodeCount = g.nodeCount || 1000;

    // Register ContentNodes
    _.each(g.nodes, function(node, key) {
      that.set('nodes', key, new ContentNode(that, key, node));
    });

    // Register direct children
    _.each(g.children, function(nodeId) {
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
  },
  
  // Generates a unique id for new nodes
  generateId: function () {
    return this.nodeCount += 1;
  },

  // Serializes the current state to a JSON representation
  serialize: function() {
    var result = _.extend({}, this.data, {
      nodes: {},
      children: [],
      attributes: this.attributes,
      nodeCount: this.nodeCount    
    });

    this.all('children').each(function(node, key, index) {
      result.children.push(key);
    });

    this.all('nodes').each(function(node, key, index) {
      result.nodes[key] = node.serialize();
    });

    return result;
  }
});
