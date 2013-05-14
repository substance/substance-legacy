// Substance.Session
// -----------------
//
// The Composer works with a session object, which maintains
// all the state of a document session
// TODO: No multiuser support yet, use app.user

Substance.Session = function(options) {
  var that = this;
  var proto = Substance.util.prototype(this);
  this.env = options.env;

  this.lazySync = _.debounce(function() {
    if (!this.pendingSync) return;
    this.replicate();
  }, 4000);

  proto.initStores = function() {
    var username = this.user();
    var token = this.token();
    var config = Substance.config();

    this.client = new Substance.Client({
      "hub_api": config.hub_api,
      "client_id": config.client_id,
      "client_secret": config.client_secret,
      "token": token
    });

    if (username) {
      if (Substance.client_type === "native") {
        this.localStore = new Substance.RedisStore({
          scope: this.env+":"+username
        });
        // Assumes client instance is authenticated
        this.remoteStore = new Substance.RemoteStore({
          client: this.client
        });
      } else {
        this.localStore = new Substance.MemoryStore();
        this.remoteStore = new Substance.RemoteStore({
          client: this.client
        });
      }
    }
  };

  // When a doc changes, bind event handlers etc.
  proto.initDoc = function() {
    var that = this;
    this.selections = {};

    // Comments view
    this.comments = new Substance.Comments(this);

    // Register user
    this.users = {};
    this.users[this.user()] = {
      "color": "#2F2B26",
      "selection": []
    };
  },

  // Create a new document locally
  // Schema is optional (currently only used by testsuite)
  proto.createDocument = function(schema) {
    var id = Substance.util.uuid();
    var that = this;

    var cid = Substance.util.uuid();

    var meta = {
      "creator": that.user(),
      "title": "Untitled",
      "abstract": "Enter abstract"
    };

    var c1 = {
      "op": ["set", {title: meta.title, abstract: meta.abstract}],
      "sha": cid,
      "parent": null
    };

    var refs = {"master": {"head": cid, "last": cid}};

    var doc = {
      "id": id,
      "meta": meta,
      "commits": {},
      "refs": refs
    };

    doc.commits[cid] = c1;

    var doc = this.localStore.create(id, {meta: meta, commits: [c1], refs: refs});
    that.document = new Substance.Session.Document(that, doc, schema);
    this.initDoc();
  },

  proto.synched = function(docId) {
    // TODO: this should not be here as it contains implementation details
    var refs = this.localStore.getRefs(docId);
    if (refs.master) {
      return refs.master.head === refs['master']['remote-head'];
    } else {
      return false;
    }
  }

  proto.listDocuments = function() {
    if (!this.localStore) return [];

    var documents = this.localStore.list();
    var result = _.map(documents, function(doc) {
      return {
        title: doc.meta.title,
        author: "le_author",
        file: doc.id,
        id: doc.id,
        meta: doc.meta,
        updated_at: doc.meta.updated_at
      };
    });
    return result;
  },

  // Load new Document from localStore
  proto.loadDocument = function(id) {
    var that = this;
    var doc = this.localStore.get(id);
    that.document = new Substance.Session.Document(that, doc);
    that.initDoc();
  };

  proto.deleteDocument = function(id) {
    this.localStore.delete(id);
  };

  // Replicate local docstore with remote docstore
  proto.replicate = function(cb) {
    var that = this;
    this.pendingSync = false;


    var replicator = new Substance.Replicator({
      user: this.user(),
      // HACK: provisionally, as remote store relies on asynchronous API
      localStore: new Substance.AsyncStore(this.localStore),
      remoteStore: this.remoteStore
    });

    this.trigger('replication:started');

    replicator.sync(function(err) {
      that.trigger('replication:finished', err);
      if (cb) cb(err);
    });
  };

  // Select a document
  // Triggers re-render of comments panel etc.
  proto.select = function(nodes, options) {

    if (!options) options = {};
    var user = this.user(); // Use current user by default

    // Do nothing if selection hasn't changed
    // It's considered a change if you operate on the same node
    // but change from edit to selection mode (options.edit check)
    if (!this.selectionChanged(user, nodes, !!options.edit)) return;

    this.edit = !!options.edit;

    if (this.users[user].selection) {
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
  };

  proto.createPublication = function(network, cb) {
    var doc = this.document;
    var that = this;

    this.client.createPublication(doc.id, network, function(err) {
      if (err) return cb(err);
      that.loadPublications(cb);
    });
  };

  proto.deletePublication = function(id, cb) {
    var that = this;
    var doc = this.document;
    this.client.deletePublication(id, function(err) {
      if (err) return cb(err);
      that.loadPublications(cb);
    });
  };

  proto.createVersion = function(cb) {
    var doc = this.document;
    var that = this;
    var data = doc.toJSON(true); // includes indexes

    var blobs = {};


    // Push document cover?
    if (doc.properties.cover_medium) {
      blobs[doc.properties.cover_medium] = doc.store.getBlob(doc.id, doc.properties.cover_medium);
      blobs[doc.properties.cover_large] = doc.store.getBlob(doc.id, doc.properties.cover_large);
    }

    // Find all images
    _.each(doc.nodes, function(node) {
      if (node.type === "image") {
        blobs[node.medium] = doc.store.getBlob(doc.id, node.medium);
        blobs[node.large] = doc.store.getBlob(doc.id, node.large);
      }
    });

    // Attach blob data to body
    data.blobs = blobs;

    // Now create version on the server
    that.client.createVersion(doc.id, data, function(err) {
      if (err) return cb(err);
      doc.meta.published_at = new Date();
      doc.meta.published_commit = doc.getRef('head');
      doc.store.update({meta: doc.meta});
      that.loadPublications(cb);
    });
  };

  // Unpublish document
  proto.unpublish = function(cb) {
    var doc = this.document;
    var that = this;
    this.client.unpublish(doc.id, function(err) {
      if (err) return cb(err);
      delete doc.meta["published_at"];
      delete doc.meta["published_commit"];
      doc.store.update({meta: doc.meta});
    });
  };

  // Retrieve current publish state
  proto.publishState = function() {
    var doc = this.document;
    if (!doc.meta.published_commit) return "unpublished";
    if (doc.getRef('head') === doc.meta.published_commit) return "published";
    return "dirty";
  };

  // Checks if selection has actually changed for a user
  proto.selectionChanged = function(user, nodes, edit) {
    // this.edit remembers the previous selection/edit state
    return !_.isEqual(nodes, this.selection(user)) || edit !== this.edit;
  };

  // Retrieve current node selection
  proto.selection = function(user) {
    if (!user) user = this.user();
    return this.users[user].selection;
  };

  // Returns the node id of current active node
  // Only works if there's just one node selected
  proto.node = function() {
    var lvl = this.level(),
        sel = this.selection();

    if (lvl >= 2 && sel.length === 1) {
      return sel[0];
    }
  };

  // Returns current navigation level (1..3)
  proto.level = function() {
    var selection = this.users[this.user()].selection;

    // Edit mode
    if (this.edit) return 3;

    // Selection mode (one or more nodes)
    if (selection.length >= 1) return 2;

    // no selection -> document level
    return 1;
  };

  // Load Publish state
  proto.loadPublications = function(cb) {
    var doc = this.document;
    var that = this;

    this.client.listNetworks(function(err, networks) {
      if (err) return cb(err);
      that.networks = networks; // all networks
      that.client.listPublications(doc.id, function(err, publications) {
        that.publications = publications;
        _.each(that.publications, function(p) {
          // Attach network information
          p.network = _.find(that.networks, function(n) { return n.id === p.network; });
        });
        cb(null);
      });
    });
  };

  // Load Collaborators for current document
  proto.loadCollaborators = function(cb) {
    var doc = this.document;
    var that = this;
    this.client.listCollaborators(doc.id, function(err, collaborators) {
      //console.log('client.loadCollaborators: collaborators', collaborators);
      that.collaborators = collaborators;
      cb(null);
    });
  };

  // Create new collaborator on the server
  proto.createCollaborator = function(collaborator, cb) {
    var doc = this.document;
    var that = this;
    this.client.createCollaborator(doc.id, collaborator, function(err) {
      if (err) return cb(err);
      that.loadCollaborators(cb);
    });
  };

  // Delete collaborator on the server
  proto.deleteCollaborator = function(collaborator, cb) {
    var doc = this.document;
    var that = this;
    this.client.deleteCollaborator(collaborator, function(err) {
      if (err) return cb(err);
      that.loadCollaborators(cb);
    });
  };

  proto.setProperty = function(key, val) {
    appSettings.setItem(this.env+":"+key, val);
  };

  proto.getProperty = function(key) {
    return appSettings.getItem(this.env+":"+key);
  };

  proto.user = function() {
    return this.getProperty('user') || "";
  };

  proto.token = function() {
    return this.getProperty('api-token') || "";
  };

  // Authenticate session
  proto.authenticate = function(username, password, cb) {
    var that = this;
    this.client.authenticate(username, password, function(err, data) {
      if (err) return cb(err);
      that.setProperty('user', username);
      that.setProperty('api-token', data.token);

      that.initStores();
      cb(null, data);
    });
  };

  proto.logout = function() {
    this.localStore = null;
    this.remoteStore = null;
    this.setProperty('user', '');
    this.setProperty('api-token', '');
  };

  proto.authenticated = function() {
    return !!this.getProperty("user");
  };

  // Create a new user on the server
  proto.createUser = function(user, cb) {
    this.client.createUser(user, cb);
  };

  this.initStores();
};
_.extend(Substance.Session.prototype, _.Events);

Substance.Session.Document = function(session, document, schema) {
  var self = this;

  var proto = Substance.util.prototype(this);
  Substance.Document.call(this, document, schema);

  this.store = new Substance.Session.DocumentStore(session, document);

  // override apply and setRef to let Session stay in control

  // Adapter that persists the change before updating the model
  this.apply = function(operation, options) {
    options = options || {};
    // apply the operation to the document (Substance.Document.apply)
    // without triggering events
    var commit = proto.apply.call(this, operation, {"silent": true});

    if (!options['no-commit']) {
      var refs = {
        'master': {
          'head': commit.sha,
          'last': commit.sha
        }
      };
      var options = {commits: [commit], refs: refs};
      this.store.update(options);
    }

    if(!options['silent']) {
      self.trigger('commit:applied', commit);
    }
  };

  // adapter that persists the new ref before triggering
  this.setRef = function(ref, sha, silent) {
    proto.setRef.call(this, ref, sha, true);

    if (!silent) {
      var refs = {}
      refs[ref] = sha;
      var options = {refs: {"master": refs}}
      this.store.update(options);
      self.trigger('ref:updated', ref, sha);
    }
  };
}
// inherit the prototype of Substance.Document which extends util.Events
Substance.Session.Document.prototype = Substance.Document.prototype;

// A facette of the localStore for a specific document
Substance.Session.DocumentStore = function(session, document) {

  var id = document.id;
  var store = session.localStore;

  var proto = Substance.util.prototype(this);

  proto.getInfo = function() {
    return store.getInfo(id);
  };

  proto.get = function() {
    return store.get();
  };

  proto.commits = function(last, since) {
    if (arguments.length == 0) return store.commits(id);
    return store.commits(id, last, since);
  };

  proto.update = function(options) {
    // Triggers a sync with remote store if available
    session.pendingSync = true;
    session.lazySync();

    var meta = options.meta || {};
    _.extend(meta, session.document.properties);
    meta.updated_at = new Date();
    options.meta = meta;

    return store.update(id, options);
  }

  proto.getRefs = function(branch) {
    return store.getRefs(id, branch);
  };

  proto.setRefs = function(branch, refs) {
    return store.setRefs(id, branch, refs);
  };

  proto.createBlob = function(blobId, base64data) {
    return store.createBlob(id, blobId, base64data);
  };

  proto.getBlob = function(blobId) {
    return store.blobExists(id, blobId) ? store.getBlob(id, blobId) : null;
  };

  proto.deleteBlob = function(blobId) {
    return store.deleteBlob(blobId);
  };

  proto.listBlobs = function() {
    return store.listBlobs();
  };
};

// Comments
// -----------------
// This seems to be very UI specific and should be removed from Substance.Session

Substance.Comments = function(session) {
  this.session = session;
  this.scopes = [];
};

_.extend(Substance.Comments.prototype, _.Events, {
  compute: function(scope) {
    var node = this.session.node();
    this.scopes = [];

    if (node) {
      var nodeData = this.session.document.nodes[node];
      var content = nodeData.content;
      var annotations = this.session.document.find('annotations', node);
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
        comments: document.find('comments', node)
      });

      _.each(annotations, function(a) {
        if (_.include(["idea", "question", "error"], a.type)) {
          this.scopes.push({
            name: annotationText(a),
            type: a.type,
            annotation: a.id,
            id: a.id,
            comments: document.find('comments', a.id)
          });
        }
      }, this);
    } else {
      // No document scopes for now
      // this.scopes.push({
      //   id: "document_comments",
      //   name: "Document",
      //   type: "document",
      //   comments: []
      // });
    }
    this.session.trigger('comments:updated', scope);
  }
});
