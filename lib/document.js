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

Math.uuid = function (prefix, len) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split(''),
      uuid = [],
      radix = 16,
      len = len || 32;

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

var Document = function(doc, schema) {
  this.id = doc.id;

  var defaults = {
    refs: {},
    commits: {}
  };

  this.meta = doc.meta || {};
  this.model = _.extend(defaults, doc);

  // Checkout master branch
  this.checkout('master');
};

 _.extend(Document.prototype, _.Events, {

  toJSON: function() {
    return _.extend({
      id: this.id,
      meta: this.meta
    }, this.model);
  },

  get: function(property) {
    return this.content.properties[property];
  },

  reset: function() {
    // Reset content
    this.content = {
      properties: {},
      nodes: {},
      annotations: {},
      comments: {}
    };
  },

  // TODO: error handling
  // Allow both refs and sha's to be passed
  checkout: function(ref) {
    var sha;
    if (this.model.refs[ref]) {
      sha = this.getRef(ref);
    } else {
      if (this.model.commits[ref]) {
        sha = ref;
      } else {
        sha = null;
      }
    }

    this.reset();
    _.each(this.commits(sha), function(op) {
      this.apply(op.op, {silent: true});
    }, this);
    this.head = sha;
  },

  // List commits 
  // --------

  commits: function(ref, ref2) {
    // Current commit (=head)
    var commit = this.getRef(ref) || ref;
    var commit2 = this.getRef(ref2) || ref2;
    var skip = false;
    
    if (commit === commit2) return [];
    var op = this.model.commits[commit];

    if (!op) return [];
    op.sha = commit;

    var commits = [op];
    var prev = op;

    while (!skip && (op = this.model.commits[op.parent])) {
      if (commit2 && op.sha === commit2) {
        skip = true;
      } else {
        op.sha = prev.parent;
        commits.push(op);
        prev = op;
      }
    }

    return commits.reverse();
  },

  // Get sha the given ref points to
  getRef: function(ref) {
    return this.model.refs[ref];
  },

  // Go back in document history
  // --------

  undo: function() {
    var ref = this.getRef(this.head) || this.head;
    var commit = this.model.commits[ref];

    if (commit && commit.parent) {
      this.checkout(commit.parent);
      this.setRef('master', commit.parent);
    } else {
      // No more commits available
      this.reset();
      this.head = null;
      this.setRef('master', null);
    }
  },

  // If there are any undone commits
  // --------

  redo: function() {
    // var commit = this.commits('tail', this.head)[0];
    var commits = this.commits('tail');
    var that = this;
    
    // Find the right commit
    var commit = _.find(commits, function(c){ return c.parent === that.head; });

    if (commit) {
      this.checkout(commit.sha);
      this.setRef('master', commit.sha);
    }
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


  // Apply a given operation on the current document state
  apply: function(operation, options) {
    options = options ? options : {};

    // TODO: this might slow things down, it's for debug purposes
    var prevState = JSON.parse(JSON.stringify(this.content));
    Document.methods[operation[0]](this.content, operation[1]);

    // This is a checker for state verification
    verifyState(this.content, operation, prevState);

    if (!options.silent) {
      var commit = this.commit(operation);
      this.head = commit.sha; // head points to new sha

      // First trigger commit applied, which stores it
      this.trigger('commit:applied', commit);
    }
  },

  // Get ref
  getRef: function(ref) {
    return this.model.refs[ref];
  },

  // Set ref to a particular commit
  setRef: function(ref, sha, silent) {
    this.model.refs[ref] = sha;
    if (!silent) this.trigger('ref:updated', ref, sha);
  },
  
  // Create a commit for a certain operation
  commit: function(op) {
    var commit = {
      op: op,
      sha: Math.uuid(),
      parent: this.head
    };

    this.model.commits[commit.sha] = commit;
    this.setRef('master', commit.sha, true);
    this.setRef('tail', commit.sha, true);
    return commit;
  }
});


// Helper Dudes
// --------

Document.helpers = {
  annotations: function(node) {
    var annotations = {};
    _.each(this.content.annotations, function(a) {
      if (a.node === node) annotations[a.id] = a;
    });
    return annotations;
  },

  // Get comments directly attached to the node
  comments: function(node, annotation) {
    if (!node) return this.documentComments();
    if (annotation) return this.commentsForAnnotation(annotation);
    var comments = [];
    _.each(this.content.comments, function(c) {
      if (c.node === node && !c.annotation) comments.push(c);
    }, this);
    return comments;
  },

  // Get total comment count per node
  commentCount: function(node) {
    return _.select(this.content.comments, function(c) {
      return (c.node === node);
    }, this).length;
  },

  // TODO: Combine with comments()
  documentComments: function() {
    var comments = [];
    _.each(this.content.comments, function(c) {
      if (!c.node) comments.push(c);
    }, this);
    return comments;
  },

  // TODO: Combine with comments()
  commentsForAnnotation: function(annotation) {
    var comments = [];
    _.each(this.content.comments, function(c) {
      if (c.annotation === annotation) comments.push(c);
    }, this);
    return comments;
  }
}

_.extend(Document.prototype, Document.helpers);

// Document Methods
// --------

Document.methods = {

  // Document Level
  // --------

  set: function(doc, options) {
    _.each(options, function(val, key) {
      if (_.isArray(val)) {
        doc.properties[key] = ot.TextOperation.fromJSON(val).apply(doc.properties[key] || "");
      } else {
        doc.properties[key] = val;
      }
    });
  },

  insert: function(doc, options) {
    var id = options.id ? options.id : Math.uuid();

    if (doc.nodes[id]) throw('id ' +options.id+ ' already exists.');

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

    if (!node) throw('node ' +options.id+ ' not found.');
    if (_.isArray(options.data)) {
      // Use OT delta updates for text-based nodes
      node.content = ot.TextOperation.fromJSON(options.data).apply(node.content);
    } else {
      var options = _.clone(options.data);
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
  },

  // Annotation Level
  // --------

  insert_annotation: function(doc, options) {
    doc.annotations[options.id] = JSON.parse(JSON.stringify(options));
  },

  update_annotation: function(doc, options) {
    _.extend(doc.annotations[options.id], JSON.parse(JSON.stringify(options)));
  },

  delete_annotation: function(doc, options) {
    delete doc.annotations[options.id];

    // Multi delete
    if (options.nodes) {
      _.each(options.nodes, function(n) {
        delete doc.annotations[n];
      });
    }
  },

  // Comment Level
  // --------

  insert_comment: function(doc, options) {
    doc.comments[options.id] = JSON.parse(JSON.stringify(options));
  },

  update_comment: function(doc, options) {
    _.extend(doc.comments[options.id], JSON.parse(JSON.stringify(options)));
  },

  delete_comment: function(doc, options) {
    delete doc.comments[options.id];

    // Multi delete
    if (options.nodes) {
      _.each(options.nodes, function(n) {
        delete doc.comments[n];
      });
    }
  }
};


// Export Module
// --------

if (typeof exports !== 'undefined') {
  module.exports = {
    Document: Document
  };
} else {
  if (!window.Substance) window.Substance = {};
  Substance.Document = Document;
}
