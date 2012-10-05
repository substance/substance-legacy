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

};


var store = new DocumentStore();


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

  // That's the current editor
  this.user = "michael";
};

_.extend(Substance.Session.prototype, _.Events, {
  select: function(nodes, options) {
    if (!options) options = {};
    var user = options.user || this.user; // Use current user by default

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
    
    this.trigger('node:select');
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


// Send operation to the server
// -----------------

function updateDoc(operation, cb) {
  // console.log('broadcast operation so the server sees it.');
  
  // talk.send(["document:update", [operation]], function(err) {
  //   console.log('updated doc on the server', err);
  // });
}


// Load Annotated Document
// -----------------
// 
// Load an annotated document

// function loadDocument(file, cb) {
//   talk.send(["document:open", {id: "my-doc"}], function(err, document) {
//     console.log('yaay', document);
//   });

//   if (!file) {
//     var doc = JSON.parse(localStorage.getItem("document"));
//     if (doc) return cb(null, doc);
//   }

//   $.getJSON('data/'+ (file || "empty_document.json"), function(doc) {
//     cb(null, doc);
//   });
// }


// For a given node, extract comments, to populate comments view
function getComments(document, node) {
  var categories = [];
  var that = this;

  if (node) {
    var content = document.content.nodes[node].content;
    var annotations = document.getAnnotations(node);
    categories = categories.concat(commentsForNode(document, node, content, annotations));
  } else {
    categories.push({
      name: "Document",
      type: "document",
      category: "document_comments",
      comments: document.getDocumentComments()
    });
  }
  return {
    node: node,
    categories: categories,
    document: document
  };
}

// For a given piece of plaintext + annotations fetch comments
// -----------------

function commentsForNode(document, node, content, annotations) {
  var categories = [];

  // Extract annotation text from the model
  function annotationText(a) {
    if (!a.pos) return "No pos";
    return content.substr(a.pos[0], a.pos[1]);
  }

  categories.push({
    name: "Le Node",
    type: "node",
    category: "node_comments",
    comments: document.getNodeComments(node)
  });

  _.each(annotations, function(a) {
    categories.push({
      name: annotationText(a),
      type: a.type,
      annotation: a.id,
      category: a.id,
      comments: document.getCommentsForAnnotation(a.id)
    });
  }, this);
  return categories;
}


function loadDocument(id, cb) {
  store.get(id, function(err, document) {
    var session = new Substance.Session({
      document: new Substance.AnnotatedDocument(document)
    });
    cb(err, session);
  });

  // talk.send(["document:open", {id: id}], function(err, document) {
  //   var session = new Substance.Session({
  //     document: new Substance.AnnotatedDocument(document)
  //   });
  //   cb(err, session);
  // });
}

// Authenticate with your Substance user
// -----------------

function authenticate(options, cb) {
  // talk.send(["session:authenticate", options], function(err) {
  //   cb(err);
  // });
  cb(null);
}
