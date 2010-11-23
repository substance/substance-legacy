// Data.js 0.1.0 - A JavaScript library for dealing with data
// (c) 2010 Michael Aufreiter
// 
// Dependencies
//   - Underscore.js
// Inspired by
//   - Underscore.js
//   - Google Visualization API

(function(){

  // Initial Setup
  // -------------

  // The top-level namespace. All public Data.js classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Data;
  if (typeof exports !== 'undefined') {
    Data = exports;
  } else {
    Data = this.Data = {};
  }
  
  // Current version of the library. Keep in sync with `package.json`.
  Data.VERSION = '0.1.0';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = this._;
  if (!_ && (typeof require !== 'undefined')) _ = require("underscore")._;
  
  
  // Data.SortedHash
  // --------------

  Data.SortedHash = function(data) {
    var that = this;
    this.data = {};
    this.keyOrder = [];
    this.length = 0;

    if (data instanceof Array) {
      _.each(data, function(datum, index) {
        that.set(index, datum);
      });
    } else if (data instanceof Object) {
      _.each(data, function(datum, key) {
        that.set(key, datum);
      });
    }
    
    if (this.initialize) this.initialize(attributes, options);
  };

  _.extend(Data.SortedHash.prototype, {

    // Returns a copy of the sorted hash
    // Used by transformation methods
    clone: function () {
      var copy = new Data.SortedHash();
      copy.length = this.length;
      _.each(this.data, function(value, key) {
        copy.data[key] = value;
      });
      copy.keyOrder = this.keyOrder.slice(0, this.keyOrder.length);
      return copy;
    },
    
    // Set a value at a given key
    set: function (key, value, targetIndex) {
      if (key === undefined)
        return this;

      if (!this.data[key]) {
        if (targetIndex !== undefined) { // insert at a given index
          var front = this.select(function(item, key, index) {
            return index < targetIndex;
          });

          var back = this.select(function(item, key, index) {
            return index >= targetIndex;
          });

          this.keyOrder = [].concat(front.keyOrder);
          this.keyOrder.push(key);
          this.keyOrder = this.keyOrder.concat(back.keyOrder);
        } else {
          this.keyOrder.push(key);
        }
        this.length += 1;
      }

      this.data[key] = value;
      return this;
    },
    
    // Remove entry at given key
    del: function (key) {
      delete this.data[key];
      this.keyOrder.splice(this.index(key), 1);
      this.length -= 1;
      return this;
    },
    
    // Get value at given key
    get: function (key) {
      return this.data[key];
    },
    
    // Get value at given index
    at: function (index) {
      var key = this.keyOrder[index];
      return this.data[key];
    },
    
    // Get first item
    first: function () {
      return this.at(0);
    },
    
    // Get last item
    last: function () {
      return this.at(this.length-1);
    },
    
    // Returns for an index the corresponding key
    key: function (index) {
      return this.keyOrder[index];
    },
    
    // Returns for a given key the corresponding index
    index: function(key) {
      return this.keyOrder.indexOf(key);
    },
    
    // Iterate over values contained in the SortedHash
    each: function (fn) {
      var that = this;
      _.each(this.keyOrder, function(key, index) {
        fn.call(that, that.data[key], key, index);
      });
      return this;
    },
    
    // Convert to an ordinary JavaScript Array containing just the values
    values: function () {
      var result = [];
      this.each(function(value, key, index) {
        result.push(value);
      });
      return result;
    },

    // Returns all keys in current order
    keys: function () {
      return this.keyOrder;
    },
    
    // Convert to an ordinary JavaScript Array containing
    // key value pairs — used for sorting
    toArray: function () {
      var result = [];
    
      this.each(function(value, key) {
        result.push({key: key, value: value});
      });
    
      return result;
    },

    // Map the SortedHash to your needs    
    map: function (fn) {
      var result = this.clone(),
          that = this;
      result.each(function(item, key, index) {
        result.data[that.key(index)] = fn.call(result, item);
      });
      return result;
    },

    // Select items that match some conditions expressed by a matcher function
    select: function (fn) {
      var result = new Data.SortedHash(),
          that = this;
    
      this.each(function(value, key, index) {
        if (fn.call(that, value, key, index)) {
          result.set(key, value);
        }
      });
      return result;
    },
    
    // Performs a sort on the SortedHash
    sort: function (comparator) {
      var result = this.clone();
          sortedKeys = result.toArray().sort(comparator);
    
      // update keyOrder
      result.keyOrder = _.map(sortedKeys, function(k) {
        return k.key;
      });
      return result;
    },
    
    // Performs an intersection with the given SortedHash
    intersect: function(sortedHash) {
      var that = this,
      result = new Data.SortedHash();
    
      this.each(function(value, key) {
        sortedHash.each(function(value2, key2) {
          if (key === key2) {
            result.set(key, value);
          }
        });
      });
      return result;
    },
    
    // Performs an union with the given SortedHash
    union: function(sortedHash) {
      var that = this,
      result = new Data.SortedHash();
    
      this.each(function(value, key) {
        if (!result.get(key))
          result.set(key, value);
      });
      sortedHash.each(function(value, key) {
        if (!result.get(key))
          result.set(key, value);
      });
      return result;
    }
  });
  
  // Data.Comparators
  // --------------

  Data.Comparators = {};

  Data.Comparators.ASC = function(item1, item2) {
    return item1.value === item2.value ? 0 : (item1.value < item2.value ? -1 : 1);
  };

  Data.Comparators.DESC = function(item1, item2) {
    return item1.value === item2.value ? 0 : (item1.value > item2.value ? -1 : 1);
  };
  
  
  // Data.Aggregators
  // --------------

  Data.Aggregators = {};

  Data.Aggregators.SUM = function (values) {
    var result = 0;

    values.each(function(value, key, index) {
      result += value;
    });

    return result;
  };

  Data.Aggregators.MIN = function (values) {
    var result = Infinity;
    values.each(function(value, key, index) {
      if (value < result) {
        result = value;
      }
    });
    return result;
  };

  Data.Aggregators.MAX = function (values) {
    var result = -Infinity;
    values.each(function(value, key, index) {
      if (value > result) {
        result = value;
      }
    });
    return result;
  };

  Data.Aggregators.AVG = function (values) {
    return Data.Aggregators.SUM(values) / values.length;
  };

  Data.Aggregators.COUNT = function (values) {
    return values.length;
  };
  
  // Data.Node
  // --------------
  
  // JavaScript Graph implementation that hides graph complexity from
  // the interface. It introduces properties, which group types of edges
  // together. Therefore multi-partit graphs are possible without any hassle.
  // Every Node simply contains properties which conform to outgoing edges.
  // It makes heavy use of hashing through JavaScript object properties to
  // allow random access whenever possible. If I've got it right, it should 
  // perform sufficiently fast in future, allowing speedy graph traversals.
  
  Data.Node = function(options) {
    this.nodeId = Data.Node.generateId();
    if (options) {
      this.val = options.value; // used for leave nodes (simple types)
    }
    this._properties = {};
    
    if (this.initialize) this.initialize(options);
  };
  
  Data.Node.nodeCount = 0;
  
  // Generates a unique id for each node
  Data.Node.generateId = function () {
    return Data.Node.nodeCount += 1;
  };
  
  _.extend(Data.Node.prototype, {
    // Node identity, which is simply the node's id
    identity: function() {
      return this.nodeId;
    },
    
    // Replace a property with a SortedHash
    replace: function(property, sortedHash) {
      this._properties[property] = sortedHash;
    },

    // Set a Node's property
    // 
    // Parameters:
    //   - property <String> A readable property key
    //   - key <String> The value key
    //   - value <Node | Object> Either a Node or an arbitrary Object
    //
    // Returns:
    //   => [Node] The Node for property chaining
    set: function (property, key, value) {
      if (!this._properties[property]) {
        this._properties[property] = new Data.SortedHash();
      }
      this._properties[property].set(key, value instanceof Data.Node ? value : new Data.Node({value: value}));
      return this;
    },
    

    // Get node for given property at given key
    // 
    // Returns:
    //   => [Node] The target Node
    get: function (property, key) {
      if (key !== undefined && this._properties[property] !== undefined) {
        return this._properties[property].get(key);
      }
    },

    // Get all connected nodes at given property
    // Returns:
    //   => [SortedHash] A SortedHash of Nodes
    all: function(property) {
      return this._properties[property];
    },
    
    // Get first connected node at given property
    // 
    // Useful if you want to mimic the behavior of unique properties.
    // That is, if you know that there's always just one associated node
    // at a given property.
    // 
    // Returns:
    //   => [SortedHash] A SortedHash of Nodes
    first: function(property) {
      var p = this._properties[property];
      return p ? p.first() : null;  
    },

    // Value of first connected target node at given property
    // 
    // Returns:
    //   => [Object] The Node's value property
    value: function(property) {
      return this.values(property).first();
    },
    

    // Values of associated target nodes for non-unique properties
    // 
    // Returns:
    //   => [SortedHash] List of Node values
    values: function(property) {
      // TODO: check why this fails sometimes
      if (!this.all(property)) return new Data.SortedHash();
    
      return this.all(property).map(function(n) {
        return n.val;
      });
    },
    
    toString: function() {
      var str = "Node#"+this.nodeId+" {\n",
          that = this;
    
      _.each(this._properties, function(node, key) {
        str += "  "+key+": "+that.values(key).values()+"\n";
      });
    
      str += "}";
      return str;
    }
  });
  
  
  // Helpers
  // -------

  // Shared empty constructor function to aid in prototype-chain creation.
  var ctor = function(){};

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  _.inherits = function(parent, protoProps, staticProps) {
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call `super()`.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Add static properties to the constructor function, if supplied.
    if (staticProps) _.extend(child, staticProps);

    // Correctly set child's `prototype.constructor`, for `instanceof`.
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is needed later.
    child.__super__ = parent.prototype;

    return child;
  };
  
})();