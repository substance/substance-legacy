// Document - acts as a proxy to the underlying ContentGraph
// ---------------

var Document = _.inherits(ContentGraph, {
  
  selectedNode: null,
  
  createEmptyNode: function(type) {
    var key = this.g.generateId(); // Get a new unique NodeId

    // Create a node with default properties according
    // to the node type
    var data = {children: [], type: type};

    // Set default values
    ContentNode.types[type].properties.forEach(function(p) {
      data[p.key] = p.defaultValue;
    });

    return new ContentNode(this, key, data);
  },
  
  moveNode: function(sourceKey, targetKey, destination) {
    var source = this.g.get('nodes', sourceKey),
        target = this.g.get('nodes', targetKey);
    
    if (sourceKey === targetKey) return;
    
    // Remove from old position
    source.parent.removeChild(source.key);
    
    // Attach at new position
    target.parent.addChild(source, target, destination);
    
    this.makeDirtyNode(source.parent.key);
    
    if (source.parent.key !== target.parent.key) {
      this.makeDirtyNode(target.parent.key);
    }
  },
  
  makeDirtyNode: function(nodeKey) {
    var node = this.getNode(nodeKey);
    // node.dirty = true;
    this.trigger('change:node', node);
  },
  
  // Create a node of a given type
  createSiblingAfter: function(type, predecessorKey) {
    var newNode = this.createEmptyNode(type),
        predecessor = this.g.get('nodes', predecessorKey);
        
    newNode.build();
    newNode.parent = predecessor.parent;

    // Attach to ContentGraph
    predecessor.parent.addChild(newNode, predecessor, 'after');
    
    this.trigger('change:node', predecessor.parent);
    this.selectNode(newNode.key);
  },
  
  createSiblingBefore: function(type, successorKey) {
    var newNode = this.createEmptyNode(type),
        successor = this.g.get('nodes', successorKey);
        
    newNode.build();
    newNode.parent = successor.parent;

    // Attach to ContentGraph
    successor.parent.addChild(newNode, successor, 'before');
    
    this.trigger('change:node', successor.parent);
    this.selectNode(newNode.key);
  },
  
  // Create a child node of a given type
  createChild: function(type, parentKey) {
    var newNode = this.createEmptyNode(type),
        parent = this.g.get('nodes', parentKey);
    
    if (parentKey === "root") {
      parent = this.g;
    }
    
    newNode.build();
    newNode.parent = parent;

    // Attach to ContentGraph
    parent.addChild(newNode);
    
    this.trigger('change:node', parent);
    this.selectNode(newNode.key);
  },

  // Remove a node from the document
  removeNode: function(nodeKey) {
    var node = this.g.get('nodes', nodeKey);
    node.parent.removeChild(node.key);
    
    this.trigger('change:node', node.parent);
  },
  
  getNode: function(nodeKey) {
    if (nodeKey === 'root') {
      return this.g;
    } else {
      return this.g.get('nodes', nodeKey);
    }
  },
  
  updateNode: function(nodeKey, attrs) {
    var node = this.getNode(nodeKey);
    
    _.extend(node.data, attrs);
    this.makeDirtyNode(nodeKey);
  },
  
  // Update attributes of selected node
  updateSelectedNode: function(attrs) {
    if (!this.selectedNode) return;
        
    _.extend(this.selectedNode.data, attrs);
    
    // Only set dirty if explicitly requested
    if (attrs.dirty) {
      this.makeDirtyNode(this.selectedNode.key);
    }
    
    if (this.selectedNode.type === 'document') {
      this.trigger('document:changed');
    }
    
    // Notify all collaborators about the changed node
    if (app.editor.status && app.editor.status.collaborators.length > 1) {
      var serializedNode = this.selectedNode.serialize();
      delete serializedNode.children;
      
      remote.Session.registerNodeChange(this.selectedNode.key, serializedNode);
    }
  },
  
  selectNode: function(nodeKey) {
    var node = this.getNode(nodeKey);
    
    if (this.selectedNode !== node) { // only if changed
      this.selectedNode = this.getNode(nodeKey);
      this.trigger('select:node', this.selectedNode);

      // The server will respond with a status package containing my own cursor position
      remote.Session.selectNode(nodeKey);
    }
  }
});


// Mixin the Events module
_.extend(Document.prototype, Backbone.Events);


// Acts as a stub for new documents

Document.EMPTY = {
  "title": "Untitled",
  "children": ["1", "2"],
  "nodeCount": 4,
  "nodes": {
    "1": {
      "type": "section",
      "name": "First Chapter",
      "children": ["3"]
    },
    "2": {
      "type": "section",
      "name": "Second Chapter",
      "children": ["4"]
    },
    "3": {
      "type": "text",
      "content": "<p>Your text goes here.</p>"
    },
    "4": {
      "type": "text",
      "content": "<p>Additional text.</p>"
    }
  }
};

