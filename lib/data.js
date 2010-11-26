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
  

  // Helpers
  // -------

  Data.VALUE_TYPES = [
    'string',
    'number',
    'date',
    'datetime',
    'location'
  ];
  
  var isValueType = function (type) {
    return _.include(Data.VALUE_TYPES, type);
  };

  // Shared empty constructor function to aid in prototype-chain creation.
  var ctor = function(){};

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  // Taken from Underscore.js (c) Jeremy Ashkenas
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
  
  // JavaScript Node implementation that hides graph complexity from
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
    }
  });
  
  
  // Data.Type
  // --------------
  
  Data.Type = _.inherits(Data.Node, {
    constructor: function(g, key, type) {
      var that = this;
      Data.Node.call(this);
  
      this.g = g; // belongs to the DataGraph
      this.key = key;
      this.name = type.name;
  
      // extract properties
      _.each(type.properties, function(property, key) {
        var p = new Data.Node();
        p.key = key;
        p.unique = property.unique;
        p.name = property.name;
        p.expected_type = property.expected_type;
        p.replace('values', new Data.SortedHash());
        p.isValueType = function() {
          return isValueType(p.expected_type);
        };
        p.isObjectType = function() {
          return !p.isValueType();
        };
  
        that.set('properties', key, p);
      });
    }
  });
  
  
  // Data.Object
  // --------------
  
  Data.Object = _.inherits(Data.Node, {
    constructor: function(g, key, data) {
      Data.Node.call(this);
  
      this.g = g;
      this.key = key;
      this.type = g.get('types', data.type);
  
      // Memoize raw data for the build process
      this.data = data;
    },
    
    // After all nodes are recognized the Item can be built
    build: function() {
      var that = this;
  
      _.each(this.data.properties, function(property, key) {
  
        // Ask the schema wheter this property holds a
        // value type or an object type
        var values = Array.isArray(property) ? property : [property];
        var p = that.type.get('properties', key);
  
        if (!p) {
          throw "property "+key+" not found at "+that.type.key+" for object "+that.key+"";
        }
  
        // init key
        that.replace(p.key, new Data.SortedHash());
  
        if (p.isObjectType()) {
          _.each(values, function(v, index) {
            var res = that.g.get('objects', v);
            if (!res) {
              throw "Can't reference "+v;
            }
            
            // Register associated Data.Objects on the resource
            res.set('objects', that.key, that);
            that.set(p.key, res.key, res);
            p.set('values', res.key, res);
          });
        } else {
          _.each(values, function(v, index) {
            var val = p.get('values', v);
  
            // Check if the value is already registered
            // on this property
            if (!val) {
              val = new Data.Node({value: v});
            }
            // Register associated Data.Objects on the value
            val.set('objects', that.key, that);
            
            that.set(p.key, v, val);
            p.set('values', v, val);
          });
        }
      });
    },
    
    // Delegates to Node#get if 3 arguments are provided
    get: function(property, key) {
      var p = this.type.get('properties', property);
      if (!p) return null;
  
      if (arguments.length === 1) {
        if (p.isObjectType()) {
          return p.unique ? this.first(property) : this.all(property);
        } else {
          return p.unique ? this.value(property) : this.values(property);
        }
      } else {
        return Data.Node.prototype.get.call(this, property, key);
      }
    }
  });
  
  
  // Data.Graph
  // --------------
  
  Data.Graph = _.inherits(Data.Node, {
    constructor: function(g) {
      var that = this;
      Data.Node.call(this);
    
      // Process schema nodes
      var types = _.select(g, function(node, key) {
        if (node.type === 'type') {
          that.set('types', key, new Data.Type(that, key, node));
          return true;
        }
        return false;
      });
      
      // Process object nodes
      var objects = _.select(g, function(node, key) {
        if (node.type !== 'type') {
          var res = that.get('objects', key) || new Data.Object(that, key, node);
          that.set('objects', key, res);
          if (!that.get('types', node.type)) {
            throw "Type '"+node.type+"' not found for "+key+"...";
          }
          that.get('types', node.type).set('objects', key, res);
          return true;
        }
        return false;
      });
        
      // Now that all objects are registered we can build them
      this.all('objects').each(function(r, key, index) {
        r.build();
      });
    },
    
    serialize: function() {
      // Serialize schema nodes
      var result = {};
      
      this.all('types').each(function(type, key) {
        result[key] = {
          type: 'type',
          name: type.name,
          properties: {}
        };
        
        type.all('properties').each(function(property) {
          result[key].properties[property.key] = {
            name: property.name,
            unique: property.unique,
            expected_type: property.expected_type
          };
        });
      });
      
      // Serialize object nodes
      this.all('objects').each(function(obj, key) {
        // INFO: Presumes that the graph hasn't been modified
        result[key] = obj.data;
      });
      
      return result;
    },
    
    filter: function(criteria) {
      var g2 = new Data.Graph(this.serialize());
      
      // Only use a subset of the objects (those returned by criteria.run())
      // The new graph shares some objects with the old graph
      g2.replace('objects', criteria.run(this));
      return g2;
    }
  });
  
  
  // Data.Criterion
  // --------------

  Data.Criterion = function (operator, type, property, value) {
    this.operator = operator;
    this.type = type;
    this.property = property;
    this.value = value;
    this.children = [];
  };
  
  Data.Criterion.operators = {};
  
  _.extend(Data.Criterion.operators, {
    
    // Logical Connectors
    
    AND: function(target, criteria) {
      if (criteria.length === 0) return new Data.SortedHash();
      var result = criteria[0].run(target);
      for(var i=1; i < criteria.length; i++) {
        result = result.intersect(criteria[i].run(target));
      }
      return result;
    },

    OR: function(target, criteria) {
      var result = new Data.SortedHash();
      for(var i=0; i < criteria.length; i++) {
        result = result.union(criteria[i].run(target));
      }
      return result;
    },

    // Logical Operators
    
    CONTAINS: function(target, typeKey, propertyKey, value) {
      var type = target.get('types', typeKey),
          property = type.get('properties', propertyKey), //,
          v = property.get('values', value);

      // Only return results within the requested type range
      return v.all('objects').select(function(obj, key) {
        return obj.type.key === typeKey;
      });
    },
    
    // Only works with value type properties
    GT: function(target, typeKey, propertyKey, value) {
      var type = target.get('types', typeKey),
          property = type.get('properties', propertyKey),
          values = property.all('values'),
          matchedObjects = new Data.SortedHash();
          
      values = values.select(function(v) {
        return v.val >= value;
      });
      
      values.each(function(v) {
        matchedObjects = matchedObjects.union(v.all('objects'));
      });
      return matchedObjects;
    }
  });
  
  _.extend(Data.Criterion.prototype, {
    add: function(criterion) {
      this.children.push(criterion);
      return this; // Allow chaining
    },

    // Run criterion against a Data.Graph (target)
    // TODO: allow Data.Collections to be passed here too,
    // for Collections the type attribute can be derived automatically.
    run: function(target) {
      // execute operator
      if (this.operator === "AND") {
        return Data.Criterion.operators.AND(target, this.children);
      } else if (this.operator === "OR") {
        return Data.Criterion.operators.OR(target, this.children);
      } else {
        // leaf nodes
        return Data.Criterion.operators[this.operator](target, this.type, this.property, this.value);
      }
    }
  });
  
})();