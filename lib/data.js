//     (c) 2010 Michael Aufreiter
//     Data.js is freely distributable under the MIT license.
//     Portions of Daja.js are inspired or borrowed from Underscore.js,
//     Backbone.js and Google's Visualization API.
//     For all details and documentation:
//     http://github.com/michael/data


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
  Data.VERSION = '0.2.0';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = this._;
  if (!_ && (typeof require !== 'undefined')) _ = require("underscore");
  
  
  // Top Level API
  // -------

  Data.VALUE_TYPES = [
    'string',
    'object',
    'number',
    'boolean',
    'date'
  ];
  
  Data.isValueType = function (type) {
    return _.include(Data.VALUE_TYPES, type);
  };
  
  // Set a new Data.Adapter and enable Persistence API
  Data.setAdapter = function(name, config) {
    if (typeof exports !== 'undefined') {
      var Adapter = require('./adapters/'+name+'_adapter');
      Data.adapter = new Adapter(config);
    } else {
      Data.adapter = new window[name](config);
    }
  };
  
  
  /*!
  Math.uuid.js (v1.4)
  http://www.broofa.com
  mailto:robert@broofa.com

  Copyright (c) 2010 Robert Kieffer
  Dual licensed under the MIT and GPL licenses.
  */

  Data.uuid = function (prefix) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split(''),
        uuid = [],
        radix = 16,
        len = 32;

    if (len) {
      // Compact form
      for (var i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (var i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }
    
    return (prefix ? prefix : "") + uuid.join('');
  };

  // Helpers
  // -------


  // _.Events (borrowed from Backbone.js)
  // -----------------
  
  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may `bind` or `unbind` a callback function to an event;
  // `trigger`-ing an event fires all callbacks in succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.bind('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  
  _.Events = {

    // Bind an event, specified by a string name, `ev`, to a `callback` function.
    // Passing `"all"` will bind the callback to all events fired.
    bind : function(ev, callback) {
      var calls = this._callbacks || (this._callbacks = {});
      var list  = this._callbacks[ev] || (this._callbacks[ev] = []);
      list.push(callback);
      return this;
    },

    // Remove one or many callbacks. If `callback` is null, removes all
    // callbacks for the event. If `ev` is null, removes all bound callbacks
    // for all events.
    unbind : function(ev, callback) {
      var calls;
      if (!ev) {
        this._callbacks = {};
      } else if (calls = this._callbacks) {
        if (!callback) {
          calls[ev] = [];
        } else {
          var list = calls[ev];
          if (!list) return this;
          for (var i = 0, l = list.length; i < l; i++) {
            if (callback === list[i]) {
              list.splice(i, 1);
              break;
            }
          }
        }
      }
      return this;
    },

    // Trigger an event, firing all bound callbacks. Callbacks are passed the
    // same arguments as `trigger` is, apart from the event name.
    // Listening for `"all"` passes the true event name as the first argument.
    trigger : function(ev) {
      var list, calls, i, l;
      if (!(calls = this._callbacks)) return this;
      if (list = calls[ev]) {
        for (i = 0, l = list.length; i < l; i++) {
          list[i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
      }
      if (list = calls['all']) {
        for (i = 0, l = list.length; i < l; i++) {
          list[i].apply(this, arguments);
        }
      }
      return this;
    }
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
  
  
  // Data.Hash
  // --------------

  // A Hash data structure that provides a simple layer of abstraction for
  // managing a sortable data-structure with hash semantics. It's heavily
  // used throughout Data.js.
  
  Data.Hash = function(data) {
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

  _.extend(Data.Hash.prototype, _.Events, {

    // Returns a copy of the Hash
    // Used by transformation methods
    clone: function () {
      var copy = new Data.Hash();
      copy.length = this.length;
      _.each(this.data, function(value, key) {
        copy.data[key] = value;
      });
      copy.keyOrder = this.keyOrder.slice(0, this.keyOrder.length);
      return copy;
    },
    
    // Set a value at a given *key*
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
      
      this.trigger('set', key);
      return this;
    },
    
    // Delete entry at given *key*
    del: function (key) {
      if (this.data[key]) {
        delete this.data[key];
        this.keyOrder.splice(this.index(key), 1);
        this.length -= 1;
        this.trigger('del', key);
      }
      return this;
    },
    
    // Get value at given *key*
    get: function (key) {
      return this.data[key];
    },
    
    // Get value at given *index*
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
    
    // Returns for an index the corresponding *key*
    key: function (index) {
      return this.keyOrder[index];
    },
    
    // Returns for a given *key* the corresponding *index*
    index: function(key) {
      return this.keyOrder.indexOf(key);
    },
    
    // Iterate over values contained in the `Data.Hash`
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
    // key value pairs. Used by `sort`.
    toArray: function () {
      var result = [];
    
      this.each(function(value, key) {
        result.push({key: key, value: value});
      });
    
      return result;
    },
    
    // Serialize
    toJSON: function() {
      var result = {};
      
      this.each(function(value, key) {
        result[key] = value.toJSON();
      });
      return result;
    },

    // Map the `Data.Hash` to your needs
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
      var result = new Data.Hash(),
          that = this;
    
      this.each(function(value, key, index) {
        if (fn.call(that, value, key, index)) {
          result.set(key, value);
        }
      });
      return result;
    },
    
    // Performs a sort
    sort: function (comparator) {
      var result = this.clone();
          sortedKeys = result.toArray().sort(comparator);
    
      // update keyOrder
      result.keyOrder = _.map(sortedKeys, function(k) {
        return k.key;
      });
      return result;
    },
    
    // Performs an intersection with the given *hash*
    intersect: function(hash) {
      var that = this,
      result = new Data.Hash();
    
      this.each(function(value, key) {
        hash.each(function(value2, key2) {
          if (key === key2) result.set(key, value);
        });
      });
      return result;
    },
    
    // Performs an union with the given *hash*
    union: function(hash) {
      var that = this,
      result = new Data.Hash();
    
      this.each(function(value, key) {
        if (!result.get(key))
          result.set(key, value);
      });
      hash.each(function(value, key) {
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
      if (value < result) result = value;
    });
    return result;
  };

  Data.Aggregators.MAX = function (values) {
    var result = -Infinity;
    values.each(function(value, key, index) {
      if (value > result) result = value;
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
  // together. Therefore multi-partite graphs are possible without any hassle.
  // Every Node simply contains properties which conform to outgoing edges.
  // It makes heavy use of hashing through JavaScript object properties to
  // allow random access whenever possible. If I've got it right, it should 
  // perform sufficiently fast, allowing speedy graph traversals.
  
  Data.Node = function(options) {
    this.nodeId = Data.Node.generateId();
    if (options) {
      this.val = options.value;
    }
    this._properties = {};
    
    if (this.initialize) this.initialize(options);
  };
  
  Data.Node.nodeCount = 0;
  
  // Generates a unique id for each node
  Data.Node.generateId = function () {
    return Data.Node.nodeCount += 1;
  };
  
  _.extend(Data.Node.prototype, _.Events, {
    // Node identity, which is simply the node's id
    identity: function() {
      return this.nodeId;
    },
    
    // Replace a property with a complete `Hash`
    replace: function(property, hash) {
      this._properties[property] = hash;
    },

    // Set a Node's property
    // 
    // Takes a property key, a value key and value. Values that aren't
    // instances of `Data.Node` wrapped are automatically.
    set: function (property, key, value) {
      if (!this._properties[property]) {
        this._properties[property] = new Data.Hash();
      }
      this._properties[property].set(key, value instanceof Data.Node ? value : new Data.Node({value: value}));
      return this;
    },
    

    // Get node for given *property* at given *key*
    get: function (property, key) {
      if (key !== undefined && this._properties[property] !== undefined) {
        return this._properties[property].get(key);
      }
    },

    // Get all connected nodes at given *property*
    all: function(property) {
      return this._properties[property];
    },
    
    // Get first connected node at given *property*
    // 
    // Useful if you want to mimic the behavior of unique properties.
    // That is, if you know that there's always just one associated node
    // at a given property.
    first: function(property) {
      var p = this._properties[property];
      return p ? p.first() : null;  
    },

    // Value of first connected target node at given *property*
    value: function(property) {
      return this.values(property).first();
    },
    
    // Values of associated target nodes for non-unique properties
    values: function(property) {
      if (!this.all(property)) return new Data.Hash();
      return this.all(property).map(function(n) {
        return n.val;
      });
    }
  });
  
  
  // Data.Adapter
  // --------------
  
  // An abstract interface for writing and reading Data.Graphs.
  
  Data.Adapter = function(config) {
    // The config object is used to describe database credentials
    this.config = config;
  };
  
  _.extend(Data.Adapter.prototype, {
    
    // Flush the database
    flush: function() {},
    
    // Takes a query object to match objects in the database 
    // and return them as a Data.Graph
    // 
    // Fetch all nodes of `/type/document`:
    //
    //      {
    //        "type": "/type/document"
    //      }
    // 
    // Fetch all nodes of `/type/document` associated with user `/user/michael`
    // 
    //      {
    //        "type": "/type/document"
    //        "user": "/user/michael"
    //      }
    readGraph: function(qry, targetGraph, options, callback) {},
    
    // Takes a serialized graph object and persists it
    writeGraph: function(graph, callback) {}
  });
  
  
  // Data.Property
  // --------------
  
  // Meta-data (data about data) is represented as a set of properties that
  // belongs to a certain `Data.Type`. A `Data.Property` holds a key, a name
  // and an expected type, telling whether the data is numeric or textual, etc.
  
  Data.Property = _.inherits(Data.Node, {
    constructor: function(type, id, options) {
      Data.Node.call(this);
      this.key = id;
      this._id = id;
      this.type = type;
      this.unique = options.unique;
      this.name = options.name;
      this.meta = options.meta || {};
      this.validator = options.validator;
      this.required = options.required;
      this.default = options.default;
      
      // TODO: ensure that object and value types are not mixed
      this.expectedTypes = _.isArray(options['type']) ? options['type'] : [options['type']];
      this.replace('values', new Data.Hash());
    },
    
    isValueType: function() {
      return Data.isValueType(this.expectedTypes[0]);
    },
    
    isObjectType: function() {
      return !this.isValueType();
    },
    
    registerValue: function(key, value, obj) {
      // Value could be an object or value depending on the property
      if (this.isObjectType()) {
        this.set('values', key, value);
      } else {
        var val = this.get('values', key);
        if (!val) {
          val = new Data.Node({value: value});
          val.referencedObjects = new Data.Hash();
        }
        
        obj.set(this.key, key, val);
        val.referencedObjects.set(obj.key, obj);
        this.set('values', key, val); // vals are shared among objects
      }
    },
    
    unregisterValue: function(key, value) {
      if (this.isObjectType()) {
        this.all('values').del(key);
      }
    },
    
    // Aggregates the property's values
    aggregate: function (fn) {
      return fn(this.values("values"));
    }
  });
  
   
  // Data.Type
  // --------------
  
  // A `Data.Type` denotes an IS A relationship about a `Data.Object`. 
  // For example, if you type the object 'Shakespear' with the type 'Person'
  // you are saying that Shakespeare IS A person. Types are also used to hold
  // collections of properties that belong to a certain group of objects.
  
  Data.Type = _.inherits(Data.Node, {
    constructor: function(g, id, type) {
      var that = this;
      Data.Node.call(this);
  
      this.g = g; // belongs to the DataGraph
      this.key = id;
      this._id = id;
      this.type = type.type;
      this.name = type.name;
      this.meta = type.meta || {};
  
      // extract properties
      _.each(type.properties, function(property, key) {
        that.set('properties', key, new Data.Property(that, key, property));
      });
    },
    
    // Convenience function for accessing properties
    properties: function() {
      return this.all('properties');
    },
    
    // Serialize a single type node
    toJSON: function() {
      var result = {
        type: '/type/type',
        name: this.name,
        properties: {},
        meta: this.meta
      };
      
      this.all('properties').each(function(property) {
        var p = result.properties[property.key] = {
          name: property.name,
          unique: property.unique,
          type: property.expectedTypes,
          required: property.required ? true : false
        };
        if (property.default) p.default = property.default;
        if (property.validator) p.validator = property.validator;
        if (property.meta && Object.keys(property.meta).length > 0) p.meta = property.meta;
      });
      
      return result;
    }
  });
  

  // Data.Object
  // --------------
  
  // Represents a typed data object within a `Data.Graph`.
  // Provides access to properties, defined on the corresponding `Data.Type`.
  
  Data.Object = _.inherits(Data.Node, {
    constructor: function(g, id, data) {
      var that = this;
      Data.Node.call(this);
      
      this.g = g;
      
      // TODO: remove in favor of _id
      this.key = id;
      this._id = id;
      this.html_id = id.replace(/\//g, '_');
      this.dirty = true; // Every constructed node is dirty by default
      this.errors = []; // Stores validation errors
      this._types = new Data.Hash();
      
      // Associated Data.Objects
      this.referencedObjects = new Data.Hash();
      
      // Memoize raw data for the build process
      if (data) this.data = data;
      
      // Bind function to the set event in order to keep property value links updated
      this.bind('set', function(key, values, prevValues) {
        var p = this.properties().get(key);
        
        if (p.isObjectType()) {
          // Unregister prev values
          _.each(prevValues, function(value) {
            p.unregisterValue(value, that.g.get(value),that);
          });
          
          // Register new values
          _.each(values, function(value) {
            p.registerValue(value, that.g.get(value), that);
          });
        
        } else { // Value type property values
          // Unregister prev values
          _.each(prevValues, function(value) {
            p.unregisterValue(value, value, that);
          });
          
          // Register new values
          _.each(values, function(value) {
            p.registerValue(value, value, that);
          });
        }
      });
    },
    
    // Convenience function for accessing all related types
    types: function() {
      return this._types;
    },
    
    // Properties from all associated types
    properties: function() {
      var properties = new Data.Hash();
      // Prototypal inheritance in action: overriden properties belong to the last type specified
      this._types.each(function(type) {
        type.all('properties').each(function(property) {
          properties.set(property.key, property);
        });
      });
      return properties;
    },
    
    // After all nodes are recognized the Item can be built
    build: function() {
      var types = _.isArray(this.data.type) ? this.data.type : [this.data.type];
      
      if (!this.data) throw 'object has no data, and cannot be built';
      var that = this;
      
      // Pull off _id and _rev properties
      delete this.data._id;
      this._rev = this.data._rev; delete this.data._rev;
      this._deleted = this.data._deleted; delete this.data._deleted;
      
      // Initialize primary type (backward compatibility)
      this.type = this.g.get('objects', _.last(types));
      
      // Initialize types
      _.each(types, function(type) {
        that._types.set(type, that.g.get('objects', type));
        // Register properties for all types
        that._types.get(type).all('properties').each(function(property, key) {        
          function applyValue(value) {
            var values = _.isArray(value) ? value : [value];

            // Initialize Property
            that.replace(property.key, new Data.Hash());
            property.isObjectType() ? that.setObjectProperty(property, values)
                                    : that.setValueProperty(property, values);
          }

          if (that.data[key] !== undefined) {
            applyValue(that.data[key]);
          } else if (property.default) {
            applyValue(property.default);
          }
        });
      });
    },
    
    // Validates an object against its type (=schema)
    validate: function() {
      if (this.type.key === '/type/type') return true; // Skip type nodes
      
      var that = this;
      this.errors = [];
      this.type.all('properties').each(function(property, key) {
        // Required property?
        if ((that.get(key) === undefined || that.get(key) === null)) {
          if (property.required) {
            that.errors.push({property: key, message: "Property \"" + property.name + "\" is required"});
          }
        } else {
          // Correct type?
          var types = property.expectedTypes;

          function validType(value, types) {
            if (_.include(types, typeof value)) return true;
            
            // FIXME: assumes that unloaded objects are valid properties
            if (!value.data) return true;
            
            if (value instanceof Data.Object && _.include(types, value.type._id)) return true;
            
            if (typeof value === 'object' && _.include(types, value.constructor.name.toLowerCase())) return true;
            return false;
          }
          
          // Unique properties
          if (property.unique && !validType(that.get(key), types)) {
            that.errors.push({property: key, message: "Invalid type for property \"" + property.name + "\""});
          }
          
          // Non unique properties
          if (!property.unique && !_.all(that.get(key).values(), function(v) { return validType(v, types); })) {
            that.errors.push({property: key, message: "Invalid value type for property \"" + property.name + "\""});
          }
        }
        
        // Validator satisfied?
        function validValue() {
          return new RegExp(property.validator).test(that.get(key));
        }
        
        if (property.validator) {
          if (!validValue()) {
            that.errors.push({property: key, message: "Invalid value for property \"" + property.name + "\""});
          }
        }
      });
      
      return this.errors.length === 0;
    },
    
    // Helper to create an object reference
    newReference: function(id) {
      var obj = this.g.get('objects', id);
      if (!obj) {
        // Register the object (even if not yet loaded)
        obj = new Data.Object(this.g, id);
        this.g.set('objects', id, obj);
      }
      // Register referenced `Data.Objects` on the object
      obj.referencedObjects.set(this.key, this);
      return obj;
    },
    
    // Set an object type property
    setObjectProperty: function(p, values)  {
      var that = this;
      
      that.replace(p.key, new Data.Hash());
      _.each(values, function(v, index) {
        if (!v) return; // skip
        
        if (typeof v === 'object') {
          v = that.g.set(null, v)._id;
        }
        
        var obj = that.newReference(v);
        var prevKeys = that.all(p.key).keys();
        that.set(p.key, obj.key, obj);
        
        
        that.trigger('set', p.key, that.all(p.key).keys(), prevKeys);
        
        // p.registerValue(obj.key, obj);
        // Register values on property - now automatically triggerd by set events
        // p.set('values', obj.key, obj);
      });
    },
    
    // Set a value type property
    setValueProperty: function(p, values) {
      var that = this;

      // Reset property
      that.replace(p.key, new Data.Hash());
      _.each(values, function(v, index) {
        var val = p.get('values', v);
        
        // TODO: Move all val related code to registerValue()
        // Check if the value is already registered
        // on this property
        if (!val) {
          val = new Data.Node({value: v});
          val.referencedObjects = new Data.Hash();
        }
        
        var prevKeys = that.all(p.key).keys();
        that.set(p.key, v, val);
        that.trigger('set', p.key, that.all(p.key).keys(), prevKeys);
        
        // Register associated `Data.Objects` on the value        
        // val.referencedObjects.set(that.key, that);
        // that.set(p.key, v, val);
        // p.set('values', v, val);
      });
    },
    
    // There are four different access scenarios for getting a certain property
    // 
    // * Unique value types
    // * Non-unique value types
    // * Unique object types 
    // * Non-Unique object types 
    // 
    // For convenience there's a get method, which always returns the right
    // result depending on the schema information. However, internally, every
    // property of a resource is represented as a non-unique `Data.Hash` 
    // of `Data.Node` objects, even if it's a unique property. So if you want 
    // to be explicit you should use the native methods of `Data.Node`. If
    // two arguments are provided `get` delegates to `Data.Node#get`.
    
    get: function(property, key) {
      if (!this.data) return null;
      var p = this.properties().get(property);
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
    },
    
    // Get a property asynchronously
    // Handles cases where an object is not yet populated with data
    getAsync: function(property, callback) {
      var that = this;
      if (!this.data) {
        this.g.fetch({_id: this._id}, {}, function(err) {
          err ? callback(err) : callback(null, that.get(property));
        });
      } else {
        callback(null, that.get(property)); // Delegate to Data.Object#get
      }
    },
    
    // Sets properties on the object
    // Existing properties are overridden / replaced
    set: function(properties) {
      var that = this;
      
      if (arguments.length === 1) {
        _.each(properties, function(value, key) {
          // TODO: improve this
          var prevValues = that.all('key') ? that.all(key).keys() : [];
          var p = that.properties().get(key);
          if (!p) return; // Property not found on type
          
          if (p.isObjectType()) {
            that.setObjectProperty(p, _.isArray(value) ? value : [value]);
          } else {
            that.setValueProperty(p, _.isArray(value) ? value : [value]);
          }
          
          that.trigger('set', key, that.all(key).keys(), prevValues);
          that.dirty = true;
        });
      } else {
        return Data.Node.prototype.set.call(this, arguments[0], arguments[1], arguments[2]);
      }
    },
    
    // Serialize an `Data.Object`'s properties
    toJSON: function() {
      var that = this;
      result = {};
      
      _.each(this._properties, function(value, key) {
        var p = that.properties().get(key);
        if (p.isObjectType()) {
          result[key] = p.unique ? that.all(key).keys()[0] : that.all(key).keys()
        } else {
          result[key] = p.unique ? that.value(key) : that.values(key).values();
        }
      });
      
      result['type'] = this.types().keys();
      result['_id'] = this._id;
      if (this._rev !== undefined) result['_rev'] = this._rev;
      if (this._deleted) result['_deleted'] = this._deleted;
      return result;
    }
  });
  
  _.extend(Data.Object.prototype, _.Events);
  
  
  // Data.Graph
  // --------------
  
  // A `Data.Graph` can be used for representing arbitrary complex object
  // graphs. Relations between objects are expressed through links that
  // point to referred objects. Data.Graphs can be traversed in various ways.
  // See the testsuite for usage. They're meant to be used read-only in a 
  // functional style.
  
  Data.Graph = _.inherits(Data.Node, {
    constructor: function(g) {
      var that = this;
      Data.Node.call(this);
      
      this.replace('objects', new Data.Hash());
      if (!g) return;
      this.merge(g, true);
    },
    
    // Merges in another Graph
    merge: function(g, dirty) {
      var that = this;
      
      // Process schema nodes
      var types = _.select(g, function(node, key) {
        if (node.type === '/type/type' || node.type === 'type') {
          if (!that.get('objects', key)) {
            that.set('objects', key, new Data.Type(that, key, node));
            that.get(key).dirty = dirty;
          }
          return true;
        }
        return false;
      });
      
      // Process object nodes
      var objects = _.select(g, function(node, key) {
        if (node.type !== '/type/type' && node.type !== 'type') {
          var res = that.get('objects', key);
          var types = _.isArray(node.type) ? node.type : [node.type];
          
          if (!res) {
            res = new Data.Object(that, key, node);
            that.set('objects', key, res);
          } else {
            // Populate existing node with data in order to be rebuilt
            res.data = node;
          }
          
          // Check for type existence
          _.each(types, function(type) {
            if (!that.get('objects', type)) {
              console.log("Type '"+type+"' not found for "+key+"...");
              throw "Type '"+type+"' not found for "+key+"...";
            }
            that.get('objects', type).set('objects', key, res);
          });

          
          that.get(key).dirty = dirty;
          
          return true;
        }
        return false;
      });

      // Now that all objects are registered we can build them
      this.objects().each(function(r, key, index) {
        if (r.data) {
          r.build();
        }
      });
    },
    
    // API method for accessing objects in the graph space
    // TODO: Ask the datastore if the node is not known in the local graph
    //       use async method queues for this!
    get: function(id) {
      if (arguments.length === 1) {
        return this.get('objects', id);
      } else {
        return Data.Node.prototype.get.call(this, arguments[0], arguments[1]);
      }
    },
    
    // Delete node by id, referenced nodes remain untouched
    // Incoming links 
    del: function(id) {
      var node = this.get(id);
      
      node._deleted = true;
      node.dirty = true;
    },
    
    // Set (add) a new node on the graph
    set: function(id, properties) {
      var that = this;
      var types = _.isArray(properties.type) ? properties.type : [properties.type];
      
      if (arguments.length === 2) {
        id = id ? id : Data.uuid('/' + _.last(_.last(types).split('/')) + '/');
        
        var res = new Data.Object(that, id, properties, true);
        res.dirty = true;
        res.build();
        
        this.set('objects', id, res);
        return this.get('objects', id);
        
      } else { // Delegate to Data.Node#set
        return Data.Node.prototype.set.call(this, arguments[0], arguments[1], arguments[2]);
      }
    },
    
    // Get a node asynchronously
    // Handles cases where an object is not yet there and needs to be fetched from
    // the server first
    getAsync: function(id, callback) {
      var that = this,
          node = this.get(id);
      
      if (!node || !node.data) {
        that.fetch({_id: id}, {}, function(err) {
          err ? callback(err) : callback(null, that.get(id));
        });
      } else {
        // Delegate to Data.Graph#get
        callback(null, node);
      }
    },
    
    // Serializes the graph to the JSON-based exchange format
    toJSON: function() {
      var result = {};
      
      // Serialize object nodes
      this.all('objects').each(function(obj, key) {
        // Only serialize fetched nodes
        if (obj.data || obj instanceof Data.Type) {
          result[key] = obj.toJSON();
        }
      });
      
      return result;
    },
    
    // Fetches a new subgraph from the adapter and either merges the new nodes
    // into the current set of nodes or replaces the graph completely with
    // the query result
    fetch: function(qry, options, callback) {
      var that = this;
      
      Data.adapter.readGraph(qry, this, options, function(err, graph) {
        if (graph) {
          that.merge(graph, false);
        } // else no nodes found
        
        err ? callback(err) : callback(null, graph);
      });
    },
    
    
    // Only == and |= operators are yet implemented
    // TODO: Should support the same qry interface as Data.Graph#fetch
    find: function(qry) {
      return this.objects().select(function(o) {
        var so = o.toJSON();
        var rejected = false;
        _.each(qry, function(value, key) {
          var condition;
          // Extract operator
          var matches = key.match(/^([a-z_]{1,30})(!=|>|>=|<|<=|\|=)?$/),
              property = matches[1],
              operator = matches[2] || '==';
          
          if (operator === "|=") { // one of operator
            condition = _.include(so[property], value);
          } else { // regular operators
            condition = so[property] === value;
          }
          
          if (!condition) rejected = true;
        });
        return !rejected;
      });
    },
    
    // Write all new and dirty nodes to the server
    save: function(callback) {
      var that = this,
          nodes = that.dirtyNodes();
      
      // Validate nodes
      var invalidNodes = nodes.select(function(node, key) {
        if (node.validate) {
          return !node.validate();
        } else return false;
      });
      
      if (invalidNodes.length > 0) return callback('validation_error', invalidNodes);
      
      Data.adapter.writeGraph(nodes.toJSON(), function(err) {
        if (err) {
          callback(err);
        } else {
          // Now all nodes are clean.
          nodes.each(function(n) {
            n.dirty = false;
          });
          callback(null, invalidNodes);
        }
      });
    },
    
    // Perform a filter on the graph. Expects `Data.Criterion` object
    // describing the filter conditions
    filter: function(criteria) {
      var g2 = {};
      
      // Include schema information from the original graph
      this.types().each(function(type, key) {
        g2[key] = type.toJSON();
      });
      
      // Include matched object nodes
      criteria.run(this).each(function(obj, key) {
        g2[key] = obj.toJSON();
      });
      
      return new Data.Graph(g2);
    },
    
    // Type nodes
    types: function() {
      return this.all('objects').select(function(node, key) {
        return node.type === '/type/type' || node.type === 'type';
      });
    },
    
    // Object nodes
    objects: function() {
      return this.all('objects').select(function(node, key) {
        return node.type !== '/type/type' && node.type !== 'type' && node.data && !node._deleted;
      });
    },
    
    // Dirty and volatile nodes
    // Used by Data.Graph#save
    dirtyNodes: function() {
      return this.all('objects').select(function(obj, key) {
        return (obj.dirty && (obj.data || obj instanceof Data.Type));
      });
    }
    
  });
  
  
  // Data.Collection
  // --------------
  
  // A Collection is a simple data abstraction format where a dataset under
  // investigation conforms to a collection of data items that describes all
  // facets of the underlying data in a simple and universal way. You can
  // think of a Collection as a table of data, except it provides precise
  // information about the data contained (meta-data). A Data.Collection
  // just wraps a `Data.Graph` internally, in order to simplify the interface,
  // for cases where you do not have to deal with linked data.
  
  Data.Collection = function(spec) {
    var that = this,
        gspec = { "/type/item": {"type": "/type/type", "properties": {}}};

    // Convert to Data.Graph serialization format
    if (spec) {
      _.each(spec.properties, function(property, key) {
        gspec["/type/item"].properties[key] = property;
      });
      
      _.each(spec.items, function(item, key) {
        gspec[key] = item;
        gspec[key].type = "/type/item";
      });
      
      this.g = new Data.Graph(gspec);
    } else {
      this.g = new Data.Graph();
    }
  };
  
  _.extend(Data.Collection.prototype, {
    get: function(property, key) {
      if (property === 'properties') {
        return this.g.get('objects', '/type/item').get('properties', key);
      } else if (property === 'items') {
        return this.g.get('objects', key);
      }
    },
    
    all: function() {
      if (property === 'properties') {
        return this.g.get('objects', '/type/item').all('properties');
      } else if (property === 'items') {
        return this.g.all('objects', key);
      }
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
      if (criteria.length === 0) return new Data.Hash();
      var result = criteria[0].run(target);
      for(var i=1; i < criteria.length; i++) {
        result = result.intersect(criteria[i].run(target));
      }
      return result;
    },

    OR: function(target, criteria) {
      var result = new Data.Hash();
      for(var i=0; i < criteria.length; i++) {
        result = result.union(criteria[i].run(target));
      }
      return result;
    },

    // Logical Operators
    
    CONTAINS: function(target, typeKey, propertyKey, value) {
      var type = target.get('objects', typeKey),
          property = type.get('properties', propertyKey),
          v = property.get('values', value);
      
      // Only return results within the requested type range
      return v.referencedObjects.select(function(obj, key) {
        return obj.type.key === typeKey;
      });
    },
    
    // Only works with value type properties
    GT: function(target, typeKey, propertyKey, value) {
      var type = target.get('objects', typeKey),
          property = type.get('properties', propertyKey),
          values = property.all('values'),
          matchedObjects = new Data.Hash();
          
      values = values.select(function(v) {
        return v.val >= value;
      });
      
      values.each(function(v) {
        matchedObjects = matchedObjects.union(v.referencedObjects);
      });
      return matchedObjects;
    }
  });
  
  _.extend(Data.Criterion.prototype, {
    add: function(criterion) {
      this.children.push(criterion);
      return this;
    },

    // Run criterion against a Data.Graph (target)
    // TODO: allow Data.Collections to be passed here too,
    // for Collections the type attribute can be derived automatically.
    run: function(target) {
      if (this.operator === "AND") {
        return Data.Criterion.operators.AND(target, this.children);
      } else if (this.operator === "OR") {
        return Data.Criterion.operators.OR(target, this.children);
      } else {
        // Leaf nodes
        return Data.Criterion.operators[this.operator](target, this.type, this.property, this.value);
      }
    }
  });
  
})();