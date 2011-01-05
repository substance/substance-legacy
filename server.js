var express = require('express');
var app = express.createServer();
var http = require('http');
var fs = require('fs');
var Handlebars = require('./lib/handlebars');
var HTMLRenderer = require('./src/shared/renderers/html_renderer').Renderer;
var DNode = require('dnode');
var Data = require('./lib/data');
var _ = require('underscore');

// Read Config
global.config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));


// Setup Data.Adapter
Data.setAdapter('couch', { url: config.couchdb_url});

var graph = new Data.Graph();

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


// Web server
// -----------

// The DocumentBrowser on the front-end

app.get('/', function(req, res) {  
  html = fs.readFileSync(__dirname+ '/themes/'+config.theme+'/index.html', 'utf-8');
  res.send(html.replace('{{settings}}', JSON.stringify(config.settings)));
});

// Serve the stylesheet according to the selected theme
app.get('/styles.css', function(req, res) {
  css = fs.readFileSync(__dirname+ '/themes/'+config.theme+'/styles.css', 'utf-8');
  res.send(css,  {'Content-Type': 'text/css' });
});


// Fetch a document as HTML

app.get('/documents/:id.html', function(req, res) {
  Document.get(req.params.id, {
    success: function(doc) {
      res.send(_.renderTemplate('document', {
        document: new HTMLRenderer(doc).render()
      }));
    },
    error: function(err) {
      res.send(err);
    }
  });
});


// The Writer

app.get('/writer', function(req, res) {  
  html = fs.readFileSync(__dirname+ '/templates/app.html', 'utf-8');
  res.send(html.replace('{{settings}}', JSON.stringify(config.settings)));
});


// Get all documents

app.get('/documents', function(req, res) {
  Document.all({
    success: function(documents) {
      res.send(JSON.stringify(documents));
    },
    error: function() {
      res.send('Error occured.');
    }
  });
});

// Get all documents as a Data.Graph serialization

app.get('/documents.json', function(req, res) {
  Document.allAsGraph({
    success: function(result) {
      res.send(result);
    },
    error: function(err) {
      res.send(err);
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
    },
    error: function(err) {
      res.send(err);
    }
  });
});


app.get('/readgraph', function(req, res) {
  Data.adapter.readGraph(JSON.parse(req.query.qry), new Data.Graph(), JSON.parse(req.query.options), function(err, g) {
    err ? res.send(err) : res.send(JSON.stringify(g));
  });
});


app.put('/writegraph', function(req, res) {
  Data.adapter.writeGraph(req.body, function(err) {
    err ? res.send(err) : res.send('{"status": "ok"}');
  });
});




// The DNode Server (RMI Interface for the client)
// -----------

var sessions = {},       // Keeps a reference to all active sessions
    cookieSessions = {}, // Remember Client Cookie Sessions (for automatic re-authentication)
    documents = {};      // Keeps a reference to all documents that are edited


DNode(function (client, conn) {
  
  // Session API
  // -----------
  // 
  // A Session:
  //   - has an assigned user (username)
  //   - holds the connection and the client reference
  //   - knows the document that is currently edited and the participating parties.
  
  // Helpers
  // -----------
  
  var getSessionId = function() {
    var cookie = conn.stream.socketio.request.headers.cookie;
    return cookie.match(/connect.sid=([^; ]+)/)[1];
  };
  
  var buildStatusPackage = function(documentId) {
    var document = documents[documentId];
    var cursors = {};
    
    _.each(document.sessions, function(sessionId) {
      var session = sessions[sessionId];
      if (session.cursor) {
        cursors[session.cursor] = session.user
      }
    });
    
    return {
      collaborators: _.map(document.sessions, function(session) {
        return sessions[session].user;
      }),
      cursors: cursors
    };
  };
  
  var buildSystemStatusPackage = function() {
    var users = [];
    
    _.each(sessions, function(session, key) {
      users.push(session.user);
    });
    return {
      active_users: users
    }
  };
  
  var notifySystemStatus = function() {
    _.each(sessions, function(session, sessionId) {
      session.client.Session.updateSystemStatus(buildSystemStatusPackage());
    });
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
  
  var notifyNodeSelection = function(session, key) {
    var document = documents[session.document];
    var user = session.user;
    
    session.cursor = key; // reverse lookup of the sessions cursor key
    
    _.each(document.sessions, function(sessionId) {
      sessions[sessionId].client.Session.updateStatus(buildStatusPackage(session.document));
    });
  };
  
  var notifyNodeInsertion = function(documentId, insertionType, node, targetKey, parentKey, destination) {
    var document = documents[documentId];
    var session = sessions[conn.id];
    
    _.each(getCollaborators(documentId), function(sessionId) {
      sessions[sessionId].client.Session.insertNode(insertionType, _.extend(node, {nodeId: node._id}), targetKey, parentKey, destination);
    });
  };
  
  var notifyNodeMovement = function(documentId, sourceKey, targetKey, parentKey, destination) {
    var document = documents[documentId];
    var session = sessions[conn.id];
    
    _.each(getCollaborators(documentId), function(sessionId) {
      sessions[sessionId].client.Session.moveNode(sourceKey, targetKey, parentKey, destination);
    });
  };
  
  var notifyNodeDeletion = function(documentId, key, parentKey) {
    var document = documents[documentId];
    var session = sessions[conn.id];
    
    _.each(getCollaborators(documentId), function(sessionId) {
      sessions[sessionId].client.Session.removeNode(key, parentKey);
    });
  };
  
  var unregisterDocument = function(documentId) {
    var session = sessions[conn.id];
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
    notifySystemStatus();
  };
  
  var makeSession = function(username) {
    sessions[conn.id] = {
      conn: conn,
      user: username,
      client: client,
      document: null
    };
    cookieSessions[getSessionId()] = username;
    notifySystemStatus();
  };
  
  // Interface for collaborative document editing sessions
  // ------------
  
  var Session = {
    authenticate: function(username, password, options) {

      graph.fetch({type: '/type/user'}, {}, function(err) {
        if (!err) {
          var user = graph.get('/user/'+username);
          if (username === user.get('username') && password === user.get('password')) {
            makeSession(username);
            options.success(username, buildSystemStatusPackage());
          } else {
            options.error();
          }
        } else options.error();
      });
    },
    
    registerUser: function(username, email, password, options) {
      var user = graph.set('/user/'+username, {
        type: '/type/user',
        username: username,
        email: email,
        password: password
      });
      
      if (user.validate()) {
        graph.save(function(err) {
          if (!err) {
            makeSession();
            options.success(username, buildSystemStatusPackage());
          } else options.error(err);
        });
      } else options.error('Not valid');
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
        options.success(username, buildSystemStatusPackage());
        notifySystemStatus(); // notify clients about new user
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
    
    // nodeKey=null if the cursor gets released
    selectNode: function(nodeKey) {
      var session = sessions[conn.id];
      notifyNodeSelection(session, nodeKey);
    },
    
    insertNode: function(insertionType, node, targetKey, parentKey, destination) {
      var session = sessions[conn.id];
      notifyNodeInsertion(session.document, insertionType, node, targetKey, parentKey, destination);
    },
    
    moveNode: function(sourceKey, targetKey, parentKey, destination) {
      var session = sessions[conn.id];
      notifyNodeMovement(session.document, sourceKey, targetKey, parentKey, destination);
    },
    
    removeNode: function(key, parentKey) {
      var session = sessions[conn.id];
      notifyNodeDeletion(session.document, key, parentKey);
    },
    
    registerNodeChange: function(key, node) {
      var session = sessions[conn.id];
      notifyNodeChange(session.document, key, node);
    },
    
    // Get the current document from the swarm (including real-time changes)
    getDocument: function(username, docname, callback) {
      
      function getDocumentId(g) {
        
        var id;
        _.each(g, function(node, key) {
          var types = _.isArray(node.type) ? node.type : [node.type];
          
          if (_.include(types, '/type/document')) id = key;
        });
        return id;
      };
      
      graph.fetch({creator: '/user/'+username, name: docname}, {expand: true}, function(err, g) {
        if (!err) {
          var id = getDocumentId(g);
          
          // Get document either from the database if you're the first starting to edit this doc
          // or from one of the collaborators having the most current doc.
          if (documents[id] && documents[id].sessions.length > 0) {
            
            // You're not alone. You are getting the doc from the swarm.
            sessions[documents[id].sessions[0]].client.Session.getDocument(function(err, hotdoc) {
              err ? callback(null, id, g) : callback(null, id, hotdoc);
            });
          } else {
            // The client is the first collaborator (the doc is fetched from the database)
            callback(null, id, g);
          }
        } else {
          callback('Not found');
        }
      });
    },
    
    // Called when a client loads an existing document
    registerDocument: function(documentId) {
      var session = sessions[conn.id];
      
      if (session.document === documentId) return;
      if (session.document) unregisterDocument(session.document);
      
      session.document = documentId;
      
      if (documents[documentId]) { // Document is already registered
        documents[documentId].sessions.push(conn.id);
        
        // Synchronizes the session with the client
        notifyCollaborators(documentId);
      } else {
        documents[documentId] = {
          sessions: [ conn.id ],
          cursors: {}
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
  
  // Expose the Session API (for realtime synchronization)
  // -----------
  
  this.Session = Session;
  
}).listen(app);


// Start the engines
// -----------

console.log('Loading schema...');
graph.fetch({type: '/type/type'}, {}, function(err) {
  if (err) {
    console.log("ERROR: Couldn't fetch schema");
    console.log(err);
  } else {
    console.log('READY: Substance is listening at http://'+(config['server_host'] || 'localhost')+':'+config['server_port']);
    app.listen(config['server_port'], config['server_host']);
  }
});
