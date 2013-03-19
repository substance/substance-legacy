// AppSettings
// -----------------
//
// Persistence for application settings

var AppSettings = function(settings) {
  var dbSettings = {
    host: "127.0.0.1",
    port: 6379,
    scope: "substance-app-settings"
  };

  this.db = redis.RedisAccess.Create(0);
  this.db.setHost(dbSettings.host);
  this.db.setPort(dbSettings.port);
  this.db.connect();
  this.db.setScope(dbSettings.scope);

  var hash = this.db.asHash("data");

  this.set = function(key, value) {
    hash.set(key, value);
  };

  this.get = function(key) {
    return hash.getJSON(key);
  };
};


var LocalStore = function(options) {
  var that = this;
  var store = options.store;
  var appSettings = options.appSettings;
  var key = appSettings.get('user')+":deleted-documents";
  var deletedDocuments = appSettings.db.asHash(key);

  // Delegate
  var methods = _.keys(store);
  _.each(methods, function(methodName) {
    var method = store[methodName];
    if (typeof method === "function") {
      that[methodName] = method;
    }
  });

  function markAsDeleted(id) {
    deletedDocuments.set(id, id);
    return true;
  }

  this.delete = function(id) {
    if (store.delete(id)) return markAsDeleted(id);
    return false;
  };

  this.deletedDocuments = function() {
    return deletedDocuments.getKeys();
  };

  this.confirmDeletion = function(id) {
    return deletedDocuments.remove(id);
  };
}

var appSettings = new AppSettings();


// Document.Store (web debug)
// -----------------

var StaticDocStore = function() {

};

StaticDocStore.prototype.get = function(id, cb) {
  // HACK: under webkitgtk XMLHttpRequests do not work for local resources :(
  //       workaround is to add a native extension that loads local data
  //       usage: substance.resources.getJSON(url)  - returns JS object
  //          or  substance.resources.get(url)      - returns content as String
  if (typeof substance !== "undefined" &&
    typeof substance.resources !== "undefined") {
     doc = substance.resources.getJSON('data/'+ (id+'.json'));
     cb(null, doc);
  } else {
    $.getJSON('data/'+ (id+'.json'), function(doc) {
      cb(null, doc);
    });
  }
};


StaticDocStore.prototype.list = function(cb) {
  cb(null, [
    { properties: { title: "Substance" }, id: "substance" },
    { properties: { title: "Hello World" }, id: "hello" }
  ]);
};


StaticDocStore.prototype.create = function(cb) {
  cb(null, {id: Math.uuid()});
};


StaticDocStore.prototype.update = function(id, operations, cb) {
  // Implement
};


StaticDocStore.prototype.delete = function(id, cb) {
  // Implement
};


// Initialize DocStore
// -----------------

var store;

// store = new StaticDocStore();

function initStore(username) {
  if (window.redis) {
    store = new LocalStore({
      scope: username,
      store: new RedisStore({
        scope: username
      }),
      appSettings: appSettings
    });
  } else {
    store = new StaticDocStore();
  }
}

initStore(user() || "anonymous");

// Update doc (docstore.update)
// -----------------

function updateDoc(doc, commit, cb) {
  store.update(doc.id, [commit], function(err) {
    // Update metadata accordingly
    updateMeta(doc, cb);
  });
};

// Update doc (docstore.setRef)
// -----------------

function updateRef(doc, ref, sha, cb) {
  store.setRef(doc.id, ref, sha);
  updateMeta(doc, cb);
};


function updateMeta(doc, cb) {
  _.extend(doc.meta, doc.content.properties);
  doc.meta.updated_at = new Date();
  store.updateMeta(doc.id, doc.meta, cb);
}

// Comments
// -----------------
// Called by Substance.Text

var Comments = function(session) {
  this.session = session;
  this.scopes = [];
};

_.extend(Comments.prototype, _.Events, {
  compute: function(scope) {
    var node = this.session.node();
    this.scopes = [];

    if (node) {
      var nodeData = this.session.document.content.nodes[node];
      var content = nodeData.content;
      var annotations = this.session.document.annotations(node);
    }

    this.commentsForNode(this.session.document, node, content, annotations, scope);
  },

  // Based on a new set of annotations (during editing)
  updateAnnotations: function(content, annotations) {
    var node = this.session.node();

    // Only consider markers as comment scopes
    var annotations = _.filter(annotations, function(a) {
      return _.include(["idea", "question", "error"], a.type);
    });

    this.commentsForNode(this.session.document, node, content, annotations);
  },

  commentsForNode: function(document, node, content, annotations, scope) {
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
        comments: document.comments(node)
      });

      _.each(annotations, function(a) {
        if (_.include(["idea", "question", "error"], a.type)) {
          this.scopes.push({
            name: annotationText(a),
            type: a.type,
            annotation: a.id,
            id: a.id,
            comments: document.commentsForAnnotation(a.id)
          });
        }

      }, this);
    } else {
      this.scopes.push({
        id: "document_comments",
        name: "Document",
        type: "document",
        comments: document.documentComments()
      });
    }

    this.session.trigger('comments:updated', scope);
  }
});


// Substance.Session
// -----------------
// 
// The Composer works with a session object, which maintains 
// all the state of a document session
// TODO: No multiuser support yet, use app.user

Substance.Session = function(options) {
  this.document = new Substance.Document(options);

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
    if (!this.selectionChanged(user, nodes, !!options.edit)) return;

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

  // Publish/Republish document
  publish: function(cb) {
    var doc = this.document;
    doc.meta.published_at = new Date();
    doc.meta.published_commit = doc.getRef('master');

    createPublication(doc, function(err) {
      if (err) return cb(err);
      updateMeta(doc, cb);  
    });
  },

  // Unpublish document
  unpublish: function(cb) {
    var doc = this.document;
    delete doc.meta["published_at"];
    delete doc.meta["published_commit"];

    clearPublications(doc, function(err) {
      if (err) return cb(err);
      updateMeta(doc, cb);
    });
  },

  publishState: function() {
    var doc = this.document;
    if (!doc.meta.published_commit) return "unpublished";
    if (doc.getRef('master') === doc.meta.published_commit) return "published";
    return "dirty";
  },

  // Checks if selection has actually changed for a user
  selectionChanged: function(user, nodes, edit) {
    return !_.isEqual(nodes, this.selection(user)) || edit !== this.edit;
  },

  // Retrieve current node selection
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


// Load a document
// -----------------

function loadDocument(id, cb) {
  store.get(id, function(err, doc) {
    cb(err, new Substance.Session(doc));
  });
}


// List all documents
// -----------------

function listDocuments(cb) {
  store.list(function(err, documents) {
    var res = _.map(documents, function(doc) {
      return {
        title: doc.meta.title,
        author: "le_author",
        file: doc.id,
        id: doc.id,
        meta: doc.meta,
        updated_at: doc.meta.updated_at
      };
    });
    cb(null, res);
  });
}


// Create a new document
// -----------------

function createDocument(cb) {
  store.create(Math.uuid(), function(err, doc) {
    cb(err, new Substance.Session(doc));
  });
}

// Substance.Hub
// =================
// 
// Talk to the Substance.Hub instance


// Create a new publication on the server
// -----------------

function createPublication(doc, cb) {
  if (!authenticated()) return cb("Error when creating publication. Login first.");
  $.ajax({
    type: 'POST',
    headers: {
      "Authorization": "token " + token()
    },
    url: Substance.settings.hub_api + '/publications',
    data: {
      "document": doc.id,
      "data": JSON.stringify(doc.content),
      "username": user()
    },
    success: function(result) {
      cb(null);
    },
    error: function() {
      cb("Error when creating publication. Can't access server.");
    },
    dataType: 'json'
  });
}


// Remove all publications from the server
// -----------------

function clearPublications(doc, cb) {
  if (!authenticated()) return cb("Unpublishing failed. Login first.");
  $.ajax({
    type: 'DELETE',
    headers: {
      "Authorization": "token " + token()
    },
    url: Substance.settings.hub_api + '/publications/' + doc.id,
    success: function(result) {
      cb(null);
    },
    error: function() {
      cb("Unpublishing failed. Can't access server");
    },
    dataType: 'json'
  });
}


function authenticated() {
  return !!token();
}

function token() {
  return appSettings.get('api-token');
}

function user() {
  return appSettings.get('user');
}

function synced(docId) {
  return store.getRef(docId, 'master') === store.getRef(docId, 'master-remote');
}

function published(doc) {
  return !!doc.meta.published_commit;
}

// Authenticate with your Substance user
// -----------------

function authenticate(options, cb) {
  $.ajax({
    type: 'POST',
    url: Substance.settings.hub_api + '/authorizations',
    data: {
      "client_id": Substance.settings.client_id,
      "client_secret": Substance.settings.client_secret
    },
    headers: {
      "Authorization": "Basic "+Base64.encode(options.username+ ":"+options.password)
    },
    success: function(result) {
      if (result.status === "error") return cb('Login failed. Check your input.');
      cb(null, result);
    },
    error: function() {
      cb('Login failed. Check your input.');
    }
  });
}


// Register new Substance user
// -----------------

function registerUser(options, cb) {
  $.ajax({
    type: 'POST',
    url: Substance.settings.hub_api + '/register',
    data: {
      "username": options.username,
      "email": options.email,
      "name": options.name,
      "password": options.password,
      "client_id": Substance.settings.client_id,
      "client_secret": Substance.settings.client_secret
    },
    success: function(result) {
      if (result.status === "error") return cb('Registration failed. Check your input.');
      cb(null, result);
    },
    error: function(err) {
      cb(JSON.parse(err.responseText).message);
    },
    dataType: 'json'
  });
}

