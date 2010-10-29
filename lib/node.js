// Node API for JavaScript
// ========================================================================
// 
// JavaScript Graph implementation that hides graph complexity from
// the interface. It introduces properties, which group types of edges
// together. Therefore multi-partit graphs are possible without any hassle.
// Every Node simply contains properties which conform to outgoing edges.
// It makes heavy use of hashing through JavaScript object properties to
// allow random access whenever possible. If I've got it right, it should 
// perform sufficiently fast in future, allowing speedy graph traversals.
// 
// Author: Michael Aufreiter
// 
// Dependencies:
//   * jQuery 1.4.2

// Node
// ------------------------------------------------------------------------
// 
// Node constructor
// 
// Parameters:
//   * options [Object]
//     - key [String] A readable unique Node identifier
//     - value [Object] The value to be stored for nodes, useful for simple types
// 
// Returns:
//   => [Node] the constructed Node
uv.Node = function (options) {
  this.nodeId = uv.Node.generateId();
  if (options) {
    this.val = options.value; // used for leave nodes (simple types)
  }
  this._properties = {};
};

// Node identity
//
// Returns:
//   => [String, Number] The Node's identity which is simply the node's id
uv.Node.prototype.identity = function() {
  return this.nodeId;
};

uv.Node.nodeCount = 0;

// Generates a unique id for each node
//
// Returns:
//   => [Number] A unique nodeId
uv.Node.generateId = function () {
  return uv.Node.nodeCount += 1;
};


uv.Node.prototype.replace = function(property, sortedHash) {
  this._properties[property] = sortedHash;
};

// Set a Node's property
// 
// Parameters:
//   - property <String> A readable property key
//   - key <String> The value key
//   - value <Node | Object> Either a Node or an arbitrary Object
//
// Returns:
//   => [Node] The Node for property chaining
uv.Node.prototype.set = function (property, key, value) {
  if (!this._properties[property]) {
    this._properties[property] = new uv.SortedHash();
  }
  this._properties[property].set(key, value instanceof uv.Node ? value : new uv.Node({value: value}));
  return this;
};

// Get node for given property at given key
// 
// Returns:
//   => [Node] The target Node
uv.Node.prototype.get = function (property, key) {
  if (key !== undefined && this._properties[property] !== undefined) {
    return this._properties[property].get(key);
  }
};



// Get all connected nodes at given property
// Returns:
//   => [SortedHash] A SortedHash of Nodes
uv.Node.prototype.all = function(property) {
  return this._properties[property];
};


// Get first connected node at given property
// 
// Useful if you want to mimic the behavior of unique properties.
// That is, if you know that there's always just one associated node
// at a given property.
// 
// Returns:
//   => [SortedHash] A SortedHash of Nodes
uv.Node.prototype.first = function(property) {
  var p = this._properties[property];
  return p ? p.first() : null;  
};

// Value of first connected target node at given property
// 
// Returns:
//   => [Object] The Node's value property
uv.Node.prototype.value = function(property) {
  return this.values(property).first();
};


// Values of associated target nodes for non-unique properties
// 
// Returns:
//   => [SortedHash] List of Node values
uv.Node.prototype.values = function(property) {
  // TODO: check why this fails sometimes
  if (!this.all(property)) return new uv.SortedHash();
  
  return this.all(property).map(function(n) {
    return n.val;
  });
};


uv.Node.prototype.toString = function() {
  var str = "Node#"+this.nodeId+" {\n",
      that = this;
      
  uv.each(this._properties, function(node, key) {
    str += "  "+key+": "+that.values(key).values()+"\n";
  });
  
  str += "}";
  return str;
};