// Global Talk instance
// -----------------

var talk = new Talk.Client("ws://localhost:3100/");


// Substance.Session
// -----------------
// 
// The Composer works with a session object, which maintains all the state of a document session

Substance.Session = function(options) {
  this.document = options.document;

  this.users = {
    "michael": {
      "color": "#82AA15",
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




// Load Annotated Document
// -----------------
// 
// Load an annotated document

function loadDocument(file, cb) {
  talk.send(["document:open", {id: "my-doc"}], function(err, document) {
    console.log('yaay', document);
  });

  if (!file) {
    var doc = JSON.parse(localStorage.getItem("document"));
    if (doc) return cb(null, doc);
  }

  $.getJSON('data/'+ (file || "empty_document.json"), function(doc) {
    cb(null, doc);
  });
}

// Create Session
// -----------------
// 
// Returns the serialized 

function createSession(cb) {

  loadDocument(null, function(err, doc) {
    var session = new Substance.Session({
      document: new Substance.AnnotatedDocument(doc)
    });
    cb(null, session);
  });
}

