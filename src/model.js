// Global Talk instance
// -----------------

// var talk = new Talk.Client("ws://localhost:3100/");

// Document.Store
// -----------------

var DocumentStore = function() {

};

DocumentStore.prototype.get = function(id, cb) {
  this.create(cb);
};


DocumentStore.prototype.create = function(cb) {
  $.getJSON('data/'+ ('default_document.json'), function(doc) {
    cb(null, doc);
  });
};


DocumentStore.prototype.update = function(id, operations, cb) {
  // Implement
};


DocumentStore.prototype.delete = function(id, cb) {
  // Implement
};


var store = new DocumentStore();

// Send operation to the server
// -----------------

function updateDoc(operation, cb) {
  // console.log('broadcast operation so the server sees it.');
  // 
  // talk.send(["document:update", [operation]], function(err) {
  //   console.log('updated doc on the server', err);
  // });
}




// Comments
// -----------------
// Called by Substance.Text

var Comments = function(session) {
  this.session = session;
  this.scopes = [];
};


_.extend(Comments.prototype, _.Events, {
  compute: function() {
    var node = this.session.node();
    this.scopes = [];

    if (node) {
      var content = this.session.document.content.nodes[node].content;
      var annotations = this.session.document.getAnnotations(node);
    }
    this.commentsForNode(this.session.document, node, content, annotations);
  },

  // Based on a new set of annotations (during editing)
  updateAnnotations: function(content, annotations) {
    var node = this.session.node();

    // Only consider markers as comment scopes
    var annotations = _.filter(annotations, function(a) {
      return _.include(["mark-1", "mark-2", "mark-3"], a.type);
    });

    this.commentsForNode(this.session.document, node, content, annotations);
  },

  commentsForNode: function(document, node, content, annotations) {
    this.scopes = [];

    // Extract annotation text from the model
    function annotationText(a) {
      if (!a.pos) return "No pos";
      return content.substr(a.pos[0], a.pos[1]);
    }

    if (node) {
      this.scopes.push({
        name: "Node",
        type: "node",
        id: "node_comments",
        comments: document.getNodeComments(node)
      });

      _.each(annotations, function(a) {
        this.scopes.push({
          name: annotationText(a),
          type: a.type,
          annotation: a.id,
          id: a.id,
          comments: document.getCommentsForAnnotation(a.id)
        });
      }, this);
    } else {
      this.scopes.push({
        id: "document_comments",
        name: "Document",
        type: "document",
        comments: document.getDocumentComments()
      });
    }
    this.session.trigger('comments:updated');
  }
});


// Substance.Session
// -----------------
// 
// The Composer works with a session object, which maintains all the state of a document session

Substance.Session = function(options) {
  this.document = options.document;

  this.users = {
    "michael": {
      "color": "#2F2B26",
      "selection": []
    }
  };

  this.selections = {};

  // Comments view
  this.comments = new Comments(this);

  // That's the current editor
  this.user = "michael";
};

_.extend(Substance.Session.prototype, _.Events, {
  select: function(nodes, options) {
    if (!options) options = {};
    var user = options.user || this.user; // Use current user by default

    // Do nothing if selection hasn't changed
    if (!this.hasChanged(user, nodes)) return;

    this.edit = !!options.edit;

    if (this.users[this.user].selection) {
      _.each(this.users[user].selection, function(node) {
        delete this.selections[node];
      }, this);
    }

    this.users[user].selection = nodes;
    _.each(nodes, function(node) {
      this.selections[node] = user;
    }, this);
    
    // New selection leads to new comment context
    this.comments.compute();

    this.trigger('node:selected');
  },

  // Checks if selection has actually changed for a user
  hasChanged: function(user, nodes) {
    return !_.isEqual(nodes, this.selection(user));
  },

  selection: function(user) {
    if (!user) user = this.user;
    return this.users[user].selection;
  },

  // Returns the node id of current active node
  // Only works if there's just one node selected
  node: function() {
    var lvl = this.level(),
        sel = this.selection();

    if (lvl >= 2 && sel.length === 1) {
      return sel[0];
    }
  },

  // Returns current navigation level (1..3)
  level: function() {
    var selection = this.users[this.user].selection;

    // Edit mode
    if (this.edit) return 3;

    // Selection mode (one or more nodes)
    if (selection.length >= 1) return 2;

    // no selection -> document level
    return 1;
  }
});


// Fetch a document
// -----------------

function loadDocument(id, cb) {
  store.get(id, function(err, document) {
    var session = new Substance.Session({
      document: new Substance.AnnotatedDocument(document)
    });
    cb(err, session);
  });
}


// Authenticate with your Substance user
// -----------------

function authenticate(options, cb) {
  // talk.send(["session:authenticate", options], function(err) {
  //   cb(err);
  // });
  cb(null);
}