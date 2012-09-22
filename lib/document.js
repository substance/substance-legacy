if (typeof exports !== 'undefined') {
  var _    = require('underscore');
  var ot   = require('operational-transformation');
}

// UUID
// -----------------

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

Math.uuid = function (prefix) {
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


// _.Events
// -----------------
// 
// Creates a TextOperation based on an array-based serialization

function createTextOperation(ops) {
  var operation = new ot.Operation(0)

  function map(method) {
    if (method === "ret") return "retain";
    if (method === "del") return "delete";
    if (method === "ins") return "insert";
  }

  _.each(ops, function(op) {
    operation[map(op[0])](op[1]);
  });
  return operation;
};


// _.Events
// -----------------

// Regular expression used to split event strings
var eventSplitter = /\s+/;

// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback functions
// to an event; trigger`-ing an event fires all callbacks in succession.
//
//     var object = {};
//     _.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//
_.Events = {

  // Bind one or more space separated events, `events`, to a `callback`
  // function. Passing `"all"` will bind the callback to all events fired.
  on: function(events, callback, context) {

    var calls, event, node, tail, list;
    if (!callback) return this;
    events = events.split(eventSplitter);
    calls = this._callbacks || (this._callbacks = {});

    // Create an immutable callback list, allowing traversal during
    // modification.  The tail is an empty object that will always be used
    // as the next node.
    while (event = events.shift()) {
      list = calls[event];
      node = list ? list.tail : {};
      node.next = tail = {};
      node.context = context;
      node.callback = callback;
      calls[event] = {tail: tail, next: list ? list.next : node};
    }

    return this;
  },

  // Remove one or many callbacks. If `context` is null, removes all callbacks
  // with that function. If `callback` is null, removes all callbacks for the
  // event. If `events` is null, removes all bound callbacks for all events.
  off: function(events, callback, context) {
    var event, calls, node, tail, cb, ctx;

    // No events, or removing *all* events.
    if (!(calls = this._callbacks)) return;
    if (!(events || callback || context)) {
      delete this._callbacks;
      return this;
    }

    // Loop through the listed events and contexts, splicing them out of the
    // linked list of callbacks if appropriate.
    events = events ? events.split(eventSplitter) : _.keys(calls);
    while (event = events.shift()) {
      node = calls[event];
      delete calls[event];
      if (!node || !(callback || context)) continue;
      // Create a new list, omitting the indicated callbacks.
      tail = node.tail;
      while ((node = node.next) !== tail) {
        cb = node.callback;
        ctx = node.context;
        if ((callback && cb !== callback) || (context && ctx !== context)) {
          this.on(event, cb, ctx);
        }
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function(events) {
    var event, node, calls, tail, args, all, rest;
    if (!(calls = this._callbacks)) return this;
    all = calls.all;
    events = events.split(eventSplitter);
    rest = Array.prototype.slice.call(arguments, 1);

    // For each event, walk through the linked list of callbacks twice,
    // first to trigger the event, then to trigger any `"all"` callbacks.
    while (event = events.shift()) {
      if (node = calls[event]) {
        tail = node.tail;
        while ((node = node.next) !== tail) {
          node.callback.apply(node.context || this, rest);
        }
      }
      if (node = all) {
        tail = node.tail;
        args = [event].concat(rest);
        while ((node = node.next) !== tail) {
          node.callback.apply(node.context || this, args);
        }
      }
    }
    return this;
  }
};

// Aliases for backwards compatibility.
_.Events.bind   = _.Events.on;
_.Events.unbind = _.Events.off;


// Invariant, that must hold after each operation
// --------

function verifyState(doc, operation, oldDoc) {

  // Ensure condition
  function ensure(condition, message) {
    if (!condition) {

      console.log('Trouble with ', operation);
      console.log(operation.op[1].nodes);
      console.log('before-state', oldDoc);

      // Check old state
      console.log('after-state', doc);

      throw message;
    }
  }

  // Correctly linked?
  // -------------

  if (Object.keys(doc.nodes).length > 0) {

    function node(id) {
      return doc.nodes[id];
    }

    var nodes = [];
    var current = node(doc.head);

    nodes.push(current.id);

    while (current.id !== doc.tail) {
      ensure(current.next, "missing next pointer at node "+ current.id);
      var next = node(current.next);
      ensure(next, "node "+current.next+" does not exist");
      current = next;
      nodes.push(current.id);
    }

    var reverseNodes = [];
    var current = node(doc.tail);
    reverseNodes.push(current.id);

    while (current.id !== doc.head) {
      ensure(current.prev, "missing prev pointer at node "+ current.id);
      var prev = node(current.prev);
      ensure(prev, "node "+current.prev+" does not exist");
      current = prev;
      reverseNodes.push(current.id);
    }

    // console.log("FORWARD NODES", nodes);
    // console.log("REVERSE NODES", reverseNodes);

    ensure(nodes.length === Object.keys(doc.nodes).length, "Unreachable nodes, walk doesn't cover all nodes");
    ensure(_.isEqual(nodes, reverseNodes.reverse()), "forward and reverse walks don't match.");
    ensure(nodes.length === reverseNodes.length, "forward and reverse walks don't match.");

  } else {
    ensure(!doc.head && !doc.tail, "head/tail points to a node that does not exist");
  }
}


// Document
// --------
// 
// A generic model for representing and transforming digital documents

var Document = function(options) {
  this.id = options.id;
  this.model = options.document;
  this.schema = options.schema;
  this.content = {
    properties: {},
    nodes: {},
  };

  // Checkout master branch
  this.checkout(options.ref || 'master');

  // Store ops for redo
  this.undoneOperations = [];
};

 _.extend(Document.prototype, _.Events, {

  // TODO: error handling
  checkout: function(ref) {
    // Reset content
    this.content = {
      properties: {},
      nodes: {},
    };

    _.each(this.operations(ref), function(op) {
      this.apply(op, true);
    }, this);
    this.head = ref;
  },

  // List operations 
  // --------

  operations: function(ref) {
    // Current commit (=head)
    var commit = this.getRef(ref) || ref;
    
    var op = this.model.operations[commit];

    if (!op) return [];
    op.sha = commit;

    var operations = [op];

    var prev = op;

    while (op = this.model.operations[op.parent]) {
      op.sha = prev.parent;
      operations.push(op);
      prev = op;
    }

    return operations.reverse();
  },

  // History for current head
  // TODO: do we need this?
  history: function() {
    return this.operations(this.head);
  },

  // Get sha the current head points to
  getRef: function(ref) {
    return this.model.refs[ref];
  },

  // Go back in document history
  // --------

  undo: function() {
    // TODO: implement
  },

  // If there are any undone operations
  // --------

  redo: function() {
    // TODO: implement
  },

  // List all nodes in a document
  // --------

  list: function(fn, ctx) {
    _.each(this.nodes(), function(node, index) {
      fn.call(ctx || this, node, index);
    });
  },

  // Traverse the document sequentially
  // --------

  nodes: function() {
    var result = [];
    var doc = this.content;
    
    function node(id) {
      return doc.nodes[id];
    }

    if (!doc.head) return;
    var current = node(doc.head);
    var index = 0;

    result.push(current);
    while (current = node(current.next)) {
      index += 1;
      result.push(current);
    }
    return result;
  },

  toJSON: function() {
    return this.content;
  },

  merge: function(ref) {
    Document.merges["fast-forward"](this, ref);
  },

  // Apply a given operation on the current document state
  apply: function(operation, silent) {
    // TODO: this might slow things done, it's for debug purposes
    var prevState = JSON.parse(JSON.stringify(this.content));
    Document.methods[operation.op[0]](this.content, operation.op[1]);

    verifyState(this.content, operation, prevState); // This is a checker for state verification

    if (!silent) {
      this.commit(operation);
      this.trigger('operation:applied', operation);
    }
  },
  
  // Create a commit for a certain operation
  commit: function(op) {
    op.sha = op.sha || Math.uuid();
    op.head = op.head || this.head;
    op.parent = this.getRef(op.head);

    this.model.operations[op.sha] = _.clone(op);

    this.model.refs[this.head] = op.sha;
  }
});

// Create a new (empty) document
// --------

Document.create = function(schema) {
  var doc = {
    "id": Math.uuid(),
    "created_at": "2012-04-10T15:17:28.946Z",
    "updated_at": "2012-04-10T15:17:28.946Z",
    "nodes": {},
    "properties": {},
    "rev": 0,
  };
  return doc;
};


// Merge Strategies
// --------

Document.merges = {

  // Teh good old fast-forward merge
  "fast-forward": function(doc, ref) {
    // For the merge, operate on a temporary doc
    var mergedDoc = new Document(doc.model);
    var sha = mergedDoc.getRef(ref);
    
    // Checkout master
    mergedDoc.checkout('master');

    function commit(sha) {
      return mergedDoc.model.operations[sha];
    }

    // Find operations between ref and master
    var operations = [];

    while (sha && sha !== mergedDoc.getRef('master')) {
      var c = commit(sha);
      operations.push(c);
      sha = c.parent;
    }

    operations.reverse();

    // Apply those guys
    _.each(operations, function(op) {
      mergedDoc.apply(op);
    });
    
    doc.model = mergedDoc.model;
    doc.checkout('master');
    return true;
  }
};


// Node manipulation interface
// --------

Document.methods = {
  set: function(doc, options) {
    _.each(options, function(val, key) {
      if (_.isArray(val)) {
        doc.properties[key] = createTextOperation(val).apply(doc.properties[key] || "");
      } else {
        doc.properties[key] = val;
      }
    });
  },

  insert: function(doc, options) {
    var id = options.id ? options.id : Math.uuid();

    // Construct a new document node
    var newNode = _.clone(options.data);

    _.extend(newNode, {
      id: id,
      type: options.type
    });

    // TODO: validate against schema
    // validate(newNode);

    // Register new node
    doc.nodes[newNode.id] = newNode;

    // Insert position
    if (options.target === "front") {
      // This goes to the front
      var headNode = doc.nodes[doc.head];

      if (headNode) {
        newNode.next = headNode.id;
        headNode.prev = newNode.id;
      }
      newNode.prev = null;
      doc.head = newNode.id;

    } else if (!options.target || options.target === "back") {
      // This goes to the back
      var tailNode = doc.nodes[doc.tail];

      if (tailNode) {
        tailNode.next = newNode.id;  
        newNode.prev = tailNode.id;  
      } else { // Empty doc
        doc.head = newNode.id;
        newNode.prev = null;
      }
      newNode.next = null;
      doc.tail = newNode.id;
    } else {
      // This goes after the target node
      var t = doc.nodes[options.target]; // Target
      var tn = doc.nodes[doc.nodes[options.target].next]; // Target-next

      newNode.prev = t.id;
      newNode.next = t.next;
      t.next = newNode.id;

      // Fix back reference of target-next
      if (tn) tn.prev = newNode.id;

      // Update tail reference if necessary
      if (t.id === doc.tail) doc.tail = newNode.id;
    }
  },

  update: function(doc, options) {
    var node = doc.nodes[options.id];

    if (_.isArray(options.data)) {
      // Use OT delta updates for text-based nodes
      node.content = createTextOperation(options.data).apply(node.content);
    } else {
      delete options.id;
      _.extend(node, options);
    }
  },

  move: function(doc, options) {
    var f  = doc.nodes[_.first(options.nodes)], // First node of selection
        l  = doc.nodes[_.last(options.nodes)], // Last node of selection
        t  = doc.nodes[options.target], // Target
        fp = doc.nodes[f.prev], // First-previous
        ln = doc.nodes[l.next]; // Last-next
       
    if (t) var tn = doc.nodes[t.next]; // target-next

    // Special case last node is tail node
    if (l.id === doc.tail) doc.tail = f.prev;

    // Move to the front
    if (options.target === "front") {
      var oldHead = doc.nodes[doc.head];
      oldHead.prev = l.id;
      oldHead.next = l.next;
      l.next = doc.head;
      doc.head = f.id;
      f.prev = null;
    } else {

      t.next = f.id;
      t.prev = t.prev === l.id ? (fp ? fp.id : null)
                               : (t.prev ? t.prev : null);

      // First node of the selection is now preceded by the target node
      f.prev = t.id;

      // Pointers, everywhere.
      l.next = tn ? tn.id : null;
    }

    if (fp) {
      fp.next = ln ? ln.id : null;
    } else { // dealing with the first node
      doc.head = ln.id; // why we had this before? doc.head = t.id;
    }

    // Set some pointers
    if (ln) ln.prev = fp ? fp.id : null;

    if (tn) {
      tn.prev = l.id;
    } else if (t && t.id === doc.tail) { // Special case: target is tail node
      doc.tail = l.id;
    }

  },

  delete: function(doc, options) {
    var f  = doc.nodes[_.first(options.nodes)], // first node of selection
        l  = doc.nodes[_.last(options.nodes)], // last node of selection
        fp = doc.nodes[f.prev], // first-previous
        ln = doc.nodes[l.next]; // last-next

    if (fp) fp.next = l.next;
    if (ln) ln.prev = f.prev;

    _.each(options.nodes, function(node) {
      delete doc.nodes[node];
    });

    // Update head/tail if needed
    if (_.include(options.nodes, doc.head)) doc.head = l.next;
    if (_.include(options.nodes, doc.tail)) doc.tail = f.prev;
  }
};


// Document
// --------

var AnnotatedDocument = _.inherits(Document, {
  constructor: function(options) {
    this.annotations = new Document({
      document: options.annotations,
      ref: options.ref
    });
    Document.call(this, options);
  },

  // For a given node id, return all associated comments
  comments: function(node) {
    var comments = _.filter(this.annotations.nodes(), function(annotation) {
      if (annotation.type !== "comment") return false;
      return _.intersection([node], annotation.nodes).length > 0;
    });
    return comments.length;
  },

  toJSON: function() {
    return {
      id: this.id,
      document: this.model,
      annotations: this.annotations.model
    };
  }
});


// Export Module
// --------

if (typeof exports !== 'undefined') {
  module.exports = {
    Document: Document,
    AnnotatedDocument: AnnotatedDocument
  };
} else {
  if (!window.Substance) window.Substance = {};
  Substance.Document = Document;
  Substance.AnnotatedDocument = AnnotatedDocument;
}