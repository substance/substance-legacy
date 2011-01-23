var express = require('express');
var app = express.createServer();
var http = require('http');
var fs = require('fs');
var Handlebars = require('./lib/handlebars');
var HTMLRenderer = require('./src/client/renderers/frontend_renderer').Renderer;
// var DNode = require('dnode');
var Data = require('./lib/data/data');
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
  app.use(express.session({secret: config['secret']}));
  app.use(app.router);
  app.use(express.staticProvider(__dirname));
  app.use(express.logger({ format: ':method :url' }));
});


// Web server
// -----------

app.get('/', function(req, res) {  
  html = fs.readFileSync(__dirname+ '/templates/app.html', 'utf-8');
  
  // Client seed
  graph.fetch({"type|=": ["/type/type", "/type/config", "/type/attribute"]}, {}, function(err, g) {
    res.send(html.replace('{{seed}}', JSON.stringify(g)).replace('{{session}}', JSON.stringify(req.session)));
  });
});


app.post('/login', function(req, res) {  
  var username = req.body.username,
      password = req.body.password;
  
  graph.fetch({type: '/type/user'}, {}, function(err) {
    if (!err) {
      var user = graph.get('/user/'+username);
      if (user && username === user.get('username') && password === user.get('password')) {
        var seed = {};
        seed[user._id] = user.toJSON();
        delete seed[user._id].password;
        
        res.send({
          status: "ok",
          username: username,
          seed: seed
        });
        
        req.session.username = username;
        req.session.seed = seed;
      } else {
        res.send({status: "error"});
      }
    } else {
      res.send({status: "error"});
    }
  });
});

app.post('/logout', function(req, res) {  
  delete req.session.username;
  delete req.session.seed;
  res.send({status: "ok"});
});


app.post('/register', function(req, res) {
  var username = req.body.username,
      password = req.body.password,
      email = req.body.email,
      name = req.body.name;
      
  graph.fetch({type: '/type/user'}, {}, function(err) {
    if (err) return res.send({"status": "error"});
    if (graph.get('/user/'+username)) return res.send({"status": "error", "message": "User already exists"});
    
    var user = graph.set('/user/'+username, {
      type: '/type/user',
      username: username,
      name: name,
      email: email,
      password: password
    });
    
    if (user.validate()) {
      graph.sync(function(err) {
        if (!err) {
          var seed = {};
          seed[user._id] = user.toJSON();
          delete seed[user._id].password;
          res.send({
            status: "ok",
            username: username,
            seed: seed
          });
          req.session.username = username;
          req.session.seed = seed;
        } else {
          return res.send({"status": "error"});
        }
      });
    } else return res.send({"status": "error", "message": "Not valid"});
  });

});

// Returns the most recent version of the requested doc
app.get('/readdocument', function(req, res) {
  var creator = req.query.creator,
      name = req.query.name;
  
  function getDocumentId(g) {
    var id;
    _.each(g, function(node, key) {
      var types = _.isArray(node.type) ? node.type : [node.type];
      
      if (_.include(types, '/type/document')) id = key;
    });
    return id;
  };

  graph.fetch({creator: '/user/'+creator, name: name}, {expand: true}, function(err, g) {
    if (!err) {
      var id = getDocumentId(g);        
      // The client is the first collaborator (the doc is fetched from the database)
      if (id) {
        res.send({status: "ok", id: id, graph: g});
      } else {
        res.send({status: "error"});
      }
    } else {
      res.send({status: "error"});
    }
  });
});

app.get('/readgraph', function(req, res) {
  var callback = req.query.callback,
      query = JSON.parse(req.query.qry),
      options = JSON.parse(req.query.options)
  
  Data.adapter.readGraph(JSON.parse(req.query.qry), new Data.Graph(), JSON.parse(req.query.options), function(err, g) {
    err ? res.send(callback+"("+JSON.stringify(err)+");")
        : res.send(callback+"("+JSON.stringify(g)+");");
  });
});

app.put('/writegraph', function(req, res) {
  Data.adapter.writeGraph(req.body, function(err) {
    err ? res.send(err) : res.send('{"status": "ok"}');
  });
});

// The DNode Server (RMI Interface for the client)
// -----------

// var sessions = {},       // Keeps a reference to all active sessions
//     cookieSessions = {}, // Remember Client Cookie Sessions (for automatic re-authentication)
//     documents = {};      // Keeps a reference to all documents that are edited
// 
// 
// DNode(function (client, conn) {
//   
//   // Session API
//   // -----------
//   // 
//   // A Session:
//   //   - has an assigned user (username)
//   //   - holds the connection and the client reference
//   //   - knows the document that is currently edited and the participating parties.
//   
//   // Helpers
//   // -----------
//   
//   var getSessionId = function() {
//     var cookie = conn.stream.socketio.request.headers.cookie;
//     return cookie.match(/connect.sid=([^; ]+)/)[1];
//   };
//   
//   var buildStatusPackage = function(documentId) {
//     var document = documents[documentId];
//     var cursors = {};
//     
//     _.each(document.sessions, function(sessionId) {
//       var session = sessions[sessionId];
//       if (session.cursor) {
//         cursors[session.cursor] = session.user
//       }
//     });
//     
//     return {
//       collaborators: _.map(document.sessions, function(session) {
//         return sessions[session].user;
//       }),
//       cursors: cursors
//     };
//   };
//   
//   var buildSystemStatusPackage = function() {
//     var users = [];
//     
//     _.each(sessions, function(session, key) {
//       users.push(session.user);
//     });
//     return {
//       active_users: users
//     }
//   };
//   
//   var notifySystemStatus = function() {
//     _.each(sessions, function(session, sessionId) {
//       session.client.Session.updateSystemStatus(buildSystemStatusPackage());
//     });
//   };
//   
//   // Get a list of collaborators that are actively co-editing a certain document
//   var getCollaborators = function(documentId) {
//     var document = documents[documentId];
//     
//     return _.select(document.sessions, function(session) {
//       return session !== conn.id;
//     });
//   };
//   
//   // Notify all collaborators about the current state of a document editing session
//   var notifyCollaborators = function(documentId) {
//     var document = documents[documentId];
//     var session = sessions[conn.id];
//     
//     if (document.sessions.length <= 1) return;
//     
//     // A list of session id that are actively co-editing a certain document
//     _.each(getCollaborators(documentId), function(sessionId) {
//       sessions[sessionId].client.Session.updateStatus(buildStatusPackage(documentId));
//     });
//   };
//   
//   var notifyNodeChange = function(documentId, key, node) {
//     var document = documents[documentId];
//     var session = sessions[conn.id];
//     
//     _.each(getCollaborators(documentId), function(sessionId) {
//       sessions[sessionId].client.Session.updateNode(key, node);
//     });
//   };
//   
//   var notifyNodeSelection = function(session, key) {
//     var document = documents[session.document];
//     var user = session.user;
//     
//     session.cursor = key; // reverse lookup of the sessions cursor key
//     
//     _.each(document.sessions, function(sessionId) {
//       sessions[sessionId].client.Session.updateStatus(buildStatusPackage(session.document));
//     });
//   };
//   
//   var notifyNodeInsertion = function(documentId, insertionType, node, targetKey, parentKey, destination) {
//     var document = documents[documentId];
//     var session = sessions[conn.id];
//     
//     _.each(getCollaborators(documentId), function(sessionId) {
//       sessions[sessionId].client.Session.insertNode(insertionType, _.extend(node, {nodeId: node._id}), targetKey, parentKey, destination);
//     });
//   };
//   
//   var notifyNodeMovement = function(documentId, sourceKey, targetKey, parentKey, destination) {
//     var document = documents[documentId];
//     var session = sessions[conn.id];
//     
//     _.each(getCollaborators(documentId), function(sessionId) {
//       sessions[sessionId].client.Session.moveNode(sourceKey, targetKey, parentKey, destination);
//     });
//   };
//   
//   var notifyNodeDeletion = function(documentId, key, parentKey) {
//     var document = documents[documentId];
//     var session = sessions[conn.id];
//     
//     _.each(getCollaborators(documentId), function(sessionId) {
//       sessions[sessionId].client.Session.removeNode(key, parentKey);
//     });
//   };
//   
//   var unregisterDocument = function(documentId) {
//     var session = sessions[conn.id];
//     // Unregister the document if no one is editing it any longer
//     if (documents[documentId].sessions.length <= 1) {
//       // Remove the session from the list of contributors if he's currently editing a doc
//       documents[documentId].sessions.splice(documents[documentId].sessions.indexOf(conn.id), 1);
//       delete documents[documentId];
//     } else {
//       // Remove the session from the list of contributors if he's currently editing a doc
//       documents[documentId].sessions.splice(documents[documentId].sessions.indexOf(conn.id), 1);
//       // Fore some reason this doesn't work properly when calling notifyCollaborators
//       _.each(getCollaborators(documentId), function(sessionId) {
//         sessions[sessionId].client.Session.updateStatus(buildStatusPackage(documentId));
//       });
//     }
//   };
//   
//   // Kill the current session (happens on logout or disconnect)
//   var killSession = function() {
//     var session = sessions[conn.id];
//     if (session) var doc = session.document;
//     
//     delete sessions[conn.id];
//     
//     // Unregister document
//     if (doc) {
//       unregisterDocument(doc);
//     }
//     notifySystemStatus();
//   };
//   
//   var makeSession = function(username) {
//     sessions[conn.id] = {
//       conn: conn,
//       user: username,
//       client: client,
//       document: null
//     };
//     cookieSessions[getSessionId()] = username;
//     notifySystemStatus();
//   };
//   
//   // Interface for collaborative document editing sessions
//   // ------------
//   
//   var Session = {
//     // nodeKey=null if the cursor gets released
//     selectNode: function(nodeKey) {
//       var session = sessions[conn.id];
//       notifyNodeSelection(session, nodeKey);
//     },
//     
//     insertNode: function(insertionType, node, targetKey, parentKey, destination) {
//       var session = sessions[conn.id];
//       notifyNodeInsertion(session.document, insertionType, node, targetKey, parentKey, destination);
//     },
//     
//     moveNode: function(sourceKey, targetKey, parentKey, destination) {
//       var session = sessions[conn.id];
//       notifyNodeMovement(session.document, sourceKey, targetKey, parentKey, destination);
//     },
//     
//     removeNode: function(key, parentKey) {
//       var session = sessions[conn.id];
//       notifyNodeDeletion(session.document, key, parentKey);
//     },
//     
//     registerNodeChange: function(key, node) {
//       var session = sessions[conn.id];
//       notifyNodeChange(session.document, key, node);
//     },
//     
//     // Called when a client loads an existing document
//     registerDocument: function(documentId) {
//       var session = sessions[conn.id];
//       
//       if (session.document === documentId) return;
//       if (session.document) unregisterDocument(session.document);
//       
//       session.document = documentId;
//       
//       if (documents[documentId]) { // Document is already registered
//         documents[documentId].sessions.push(conn.id);
//         
//         // Synchronizes the session with the client
//         notifyCollaborators(documentId);
//       } else {
//         documents[documentId] = {
//           sessions: [ conn.id ],
//           cursors: {}
//         };
//       }
//       
//       // Send Status update package
//       client.Session.updateStatus(buildStatusPackage(documentId));
//     }
//   };
//   
//   // On connect (initiated by client, calling Session.initialize)
//   conn.on('connect', function() {
//     
//   });
//   
//   conn.on('end', function() {
//     killSession();
//   });
//   
//   // Expose the Session API (for realtime synchronization)
//   // -----------
//   
//   this.Session = Session;
//   
// }).listen(app);

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
