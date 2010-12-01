var express = require('express@1.0.0');
var app = express.createServer();
var http = require('http');
var cradle = require('cradle');
var fs = require('fs');
var Handlebars = require('./lib/handlebars.js');
var HTMLRenderer = require('./src/server/renderers/html_renderer').Renderer;
var DNode = require('dnode');
var qs = require('querystring');
require('./lib/underscore.js');

// Models
var Document = require('./src/server/models/document.js');
var User = require('./src/server/models/user.js');


// Read Config
var config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));

// Init CouchDB Connection
global.conn = new(cradle.Connection)(config.couchdb.host, config.couchdb.port);
global.db = conn.database(config.couchdb.db);



// Helpers
// -----------

var Helpers = {};

// Templates for the moment are recompiled every time
_.renderTemplate = function(tpl, view, helpers) {
  var source = fs.readFileSync(__dirname+ '/templates/' + tpl + '.html', 'utf-8');
  var template = Handlebars.compile(source);
  return template(view, helpers || {});
};

// Express.js Configuration
// -----------

app.configure(function(){
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(express.cookieDecoder());
  app.use(express.session());
  app.use(app.router);
  app.use(express.staticProvider(__dirname));
  app.use(express.logger({ format: ':method :url' }));
});


// Empty Data.Graph of documents

function createGraph(documents) {
  var result = {
    "/type/document": {
      "type": "type",
      "name": "Document",
      "properties": {
        "id": {
          "name": "Document Id",
          "unique": true,
          "expected_type": "string"          
        },
        "title": {
          "name": "Document Title",
          "unique": true,
          "expected_type": "string"
        }
      }
    }
  };
  
  // Append document attributes as properties
  _.each(config.settings.attributes, function(attr) {
    result["/type/document"].properties[attr.key] = {
      "name": attr.name,
      "unique": attr.unique,
      "expected_type": attr.type
    };
  });
  
  // Add registered documents to the output
  _.each(documents, function(doc) {
    result[doc.id] = {
      type: '/type/document',
      id: doc.id,
      title: doc.title
    };
    
    // Iterate over document attributes
    _.each(config.settings.attributes, function(attr) {
      var val = doc.attributes ? doc.attributes[attr.key] : undefined;
      var def = attr.default ? _.clone(attr.default) : null;
      
      result[doc.id][attr.key] = val ? val : def;
    });
  });
  return result;
};


// Web server
// -----------

// The DocumentBrowser on the front-end

app.get('/documents.html', function(req, res) {  
  html = fs.readFileSync(__dirname+ '/templates/browser.html', 'utf-8');
  res.send(html.replace('{{settings}}', JSON.stringify(config.settings)));
});


// Fetch a document as HTML

app.get('/documents/:id.html', function(req, res) {
  Document.get(req.params.id, {
    success: function(doc) {
      res.send(_.renderTemplate('document', {
        document: new HTMLRenderer(doc).render()
      }));
    }
  });
});


// The Engineroom

app.get('/', function(req, res) {  
  html = fs.readFileSync(__dirname+ '/templates/app.html', 'utf-8');
  res.send(html.replace('{{settings}}', JSON.stringify(config.settings)));
});


// Get all documents

app.get('/documents', function(req, res) {
  Document.all({
    success: function(documents) {
      res.send(JSON.stringify(documents));
    }
  });
});

// Get all documents as a Data.Graph serialization

app.get('/documents.json', function(req, res) {
  Document.all({
    withContents: true,
    success: function(documents) {
      var result = createGraph(documents);
      res.send(result);
    }
  });
});


// Get all documents with contents

app.get('/documents/full', function(req, res) {
  Document.all({
    withContents: true,
    success: function(documents) {
      res.send(JSON.stringify(documents));
    }
  });
});


// Fetch a document as JSON

app.get('/documents/:id', function(req, res) {
  Document.get(req.params.id, {
    withContents: true,
    success: function(doc) {
      res.send(JSON.stringify(doc));
    }
  });
});

app.listen(config['server_port']);


// The DNode Server (RMI Interface for the client)
// -----------

var sessions = {},        // Keeps a reference to all active sessions
    cookieSessions = {},  // Remember Client Cookie Sessions
    users = {},           // Keeps a reference to all authenticated users
    documents = {};       // Keeps a reference to all documents that are edited


DNode(function (client, conn) {
  
  // Session API
  // -----------
  // 
  // A Session:
  //   - has an assigned user (username)
  //   - holds the connection and the client reference
  //   - knows the document that is currently edited and participating parties.
  
  // Helpers
  // -----------
  
  var getSessionId = function() {
    var cookie = conn.stream.socketio.request.headers.cookie;
    return cookie.match(/connect.sid=([^; ]+)/)[1];
  };
  
  var buildStatusPackage = function(documentId) {
    var document = documents[documentId];
    
    return {
      collaborators: _.map(document.sessions, function(session) {
        return sessions[session].user;
      })
    };
  };
  
  // Get a list of collaborators that are actively co-editing a certain document
  var getCollaborators = function(documentId) {
    var document = documents[documentId];
    
    return _.select(document.sessions, function(session) {
      return session !== conn.id;
    });
  };
  
  // Notify all collaborators about the current state of a document editing session
  var notifyCollaborators = function(documentId) {
    var document = documents[documentId];
    var session = sessions[conn.id];
    
    if (document.sessions.length <= 1) return;
    
    // A list of session id that are actively co-editing a certain document
    _.each(getCollaborators(documentId), function(sessionId) {
      sessions[sessionId].client.Session.updateStatus(buildStatusPackage(documentId));
    });
  };
  
  var notifyNodeChange = function(documentId, key, node) {
    var document = documents[documentId];
    var session = sessions[conn.id];
    
    _.each(getCollaborators(documentId), function(sessionId) {
      sessions[sessionId].client.Session.updateNode(key, node);
    });
  };
  
  var notifyNodeInsertion = function(documentId, insertionType, type, targetKey, destination) {
    var document = documents[documentId];
    var session = sessions[conn.id];
    
    _.each(getCollaborators(documentId), function(sessionId) {
      sessions[sessionId].client.Session.insertNode(insertionType, type, targetKey, destination);
    });
  };
  
  var notifyNodeMovement = function(documentId, sourceKey, targetKey, destination) {
    var document = documents[documentId];
    var session = sessions[conn.id];
    
    _.each(getCollaborators(documentId), function(sessionId) {
      sessions[sessionId].client.Session.moveNode(sourceKey, targetKey, destination);
    });
  };
  
  var notifyNodeDeletion = function(documentId, key) {
    var document = documents[documentId];
    var session = sessions[conn.id];
    
    _.each(getCollaborators(documentId), function(sessionId) {
      sessions[sessionId].client.Session.removeNode(key);
    });
  };
  
  var unregisterDocument = function(documentId) {
    // Unregister the document if no one is editing it any longer
    if (documents[documentId].sessions.length <= 1) {
      // Remove the session from the list of contributors if he's currently editing a doc
      documents[documentId].sessions.splice(documents[documentId].sessions.indexOf(conn.id), 1);
      delete documents[documentId];
    } else {
      // Remove the session from the list of contributors if he's currently editing a doc
      documents[documentId].sessions.splice(documents[documentId].sessions.indexOf(conn.id), 1);
      // Fore some reason this doesn't work properly when calling notifyCollaborators
      _.each(getCollaborators(documentId), function(sessionId) {
        sessions[sessionId].client.Session.updateStatus(buildStatusPackage(documentId));
      });
    }
  };
  
  // Kill the current session (happens on logout or disconnect)
  var killSession = function() {
    var session = sessions[conn.id];
    if (session) var doc = session.document;
    
    delete sessions[conn.id];
    
    // Unregister document
    if (doc) { 
      unregisterDocument(doc);
    }
  };
  
  var makeSession = function(username) {
    sessions[conn.id] = {
      conn: conn,
      user: username,
      client: client,
      document: null
    };
    cookieSessions[getSessionId()] = username;
  };
  
  // Interface for collaborative document editing sessions
  // ------------
  
  var Session = {
    authenticate: function(username, password, options) {
      User.get(username, {
        success: function(user) {
          if (username === user.username && password === user.password) {
            makeSession(username);
            options.success(username);
          } else {
            options.error();
          }
        },
        error: function() {
          options.error();
        }
      });
    },
    
    registerUser: function(username, email, password, options) {
      User.create({
        username: username,
        email: email,
        password: password
      }, {
        success: function() {
          makeSession();
          options.success(username);
        },
        error: function(err) {
          options.error();
        }
      });
    },
        
    init: function(options) {
      // Automatic re-authentication based on cookie-data
      var username = cookieSessions[getSessionId()];
      if (username) { 
        sessions[conn.id] = {
          conn: conn,
          user: username,
          client: client,
          document: null
        };
        options.success(username);
      } else {
        options.error();
      }
    },
    
    logout: function(options) {
      // Release cookiesession
      delete cookieSessions[getSessionId()];
      
      killSession();
      options.success();
    },
    
    insertNode: function(insertionType, type, targetKey, destination) {
      var session = sessions[conn.id];
      notifyNodeInsertion(session.document, insertionType, type, targetKey, destination);
    },
    
    moveNode: function(sourceKey, targetKey, destination) {
      var session = sessions[conn.id];
      notifyNodeMovement(session.document, sourceKey, targetKey, destination);
    },
    
    removeNode: function(key) {
      var session = sessions[conn.id];
      notifyNodeDeletion(session.document, key);
    },
    
    registerNodeChange: function(key, node) {
      var session = sessions[conn.id];
      notifyNodeChange(session.document, key, node);
    },
    
    // Get the current document from the swarm (including real-time changes)
    getDocument: function(id, options) {
      // Get document either from the database if you're the first starting to edit this doc
      // or from one of the collaborators having the most current doc.
      if (documents[id] && documents[id].sessions.length > 0) {
        // You're not alone. You are getting the doc from the swarm. :)
        sessions[documents[id].sessions[0]].client.Session.getDocument({
          success: function(document) {
            options.success(document);
          }
        });
      } else {
        // The client is the first collaborator (the doc is fetched from the database)
        Document.get(id, options);
      }
    },
    
    // Called when a client loads an existing document
    registerDocument: function(documentId) {
      var session = sessions[conn.id];
      
      if (session.document === documentId) return;
      
      if (session.document) {
        unregisterDocument(session.document);
      }
      
      session.document = documentId;
      
      if (documents[documentId]) { // Document is already registered
        documents[documentId].sessions.push(conn.id);
        
        // Synchronizes the session with the client
        notifyCollaborators(documentId);
      } else {
        documents[documentId] = {
          sessions: [ conn.id ]
        };
      }
      
      // Send Status update package
      client.Session.updateStatus(buildStatusPackage(documentId));
    }
  };
  
  // On connect (initiated by client, calling Session.initialize)
  conn.on('connect', function() {
    
  });
  
  conn.on('end', function() {
    killSession();
  });
  
  // Expose the Document API (document persistence)
  // -----------
  
  this.Document = Document;
  
  // Expose the Session API (for realtime synchronization)
  // -----------
  
  this.Session = Session;
  
}).listen(app);