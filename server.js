var express = require('express');
var app = express.createServer();
var http = require('http');
var crypto = require('crypto');
var fs = require('fs');
var Data = require('./lib/data/data');
var _ = require('underscore');
var CouchClient = require('./lib/data/lib/couch-client');
var async = require('async');

// Read Config
global.config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));

// Setup Data.Adapter
Data.setAdapter('couch', { url: config.couchdb_url});

var seed;
var db = CouchClient(config.couchdb_url);

// WriteGraph Filters
Data.middleware.writegraph = [
  // TODO make middleware asynchronous!
  function ensureAuthorized(node, ctx) {
    if (_.include(node.type, "/type/document")) {
      // console.log("saving a document...."+node._id);
      if (node.creator !== "/user/"+ctx.session.username) return null;
      // TODO: Make sure that document deletion can only be done by the creator, not the collaborators.
    } else if (_.intersect(node.type, ["/type/section", "/type/visualization", "/type/text",
                                       "/type/question", "/type/answer", "/type/quote", "/type/image"]).length > 0) {
                                         
      // We need a CouchDB lookup here! It's unsave right now!
      var document = graph.get(node.document);
      if (document && document.get('creator')._id !== "/user/"+ctx.session.username) return null;
    } else if (_.include(node.type, "/type/user")) {
      // Ensure username can't be changed for existing users
      if (node._rev) node.username = graph.get(node._id).get('username');
      if (node._id !== "/user/"+ctx.session.username) return null;
    }
    return node;
  }
];

// ReadGraph Filters
Data.middleware.readgraph = [
  function hidePasswords(node, ctx) {
    // if (!ctx.session.username) return false;
    if (_.include(node.type, "/type/user")) {
      delete node.password;
    }
    return node;
  }
];

// Fetch a single node from the graph
function fetchNode(id, callback) {
  db.get(id, function(err, node) {
    if (err) return callback(err);
    
    // Attach to result graph
    callback(null, node);
  });
}

function findAttributes(member, searchstr, callback) {
  db.view(db.uri.pathname+'/_design/substance/_view/attributes', {key: member}, function(err, res) {
    // Bug-workarount related to https://github.com/creationix/couch-client/issues#issue/3
    // Normally we'd just use the err object in an error case
    if (res.error || !res.rows) {
      callback(res.error);
    } else {
      var result = {};
      var count = 0;
      
      _.each(res.rows, function(row) {
        if (row.value.name && row.value.name.match(new RegExp("("+searchstr+")", "i"))) {
          // Add to result set
          if (count < 50) { // 200 Attributes at the most
            count += 1;
            result[row.value._id] = row.value;
          }
        }
      });
      callback(null, result);
    }
  });
}


function findUsers(searchstr, callback) {
  db.view(db.uri.pathname+'/_design/substance/_view/users', function(err, res) {
    // Bug-workarount related to https://github.com/creationix/couch-client/issues#issue/3
    // Normally we'd just use the err object in an error case
  
    if (res.error || !res.rows) {
      callback(res.error);
    } else {
      var result = {};
      var count = 0;
      
      _.each(res.rows, function(row) {
        if (row.key && row.key.match(new RegExp("("+searchstr+")", "i"))) {
          // Add to result set
          if (count < 200) { // 200 Users maximum
            count += 1;
            result[row.value._id] = row.value;
            delete result[row.value._id].password
            delete result[row.value._id].email
          }
        }
      });
      callback(null, result);
    }
  });
}


// Get a single document from the database, including all associated content nodes
function getDocument(username, docname, callback) {
  db.view(db.uri.pathname+'/_design/substance/_view/documents', {key: username+'/'+docname}, function(err, res) {
    // Bug-workarount related to https://github.com/creationix/couch-client/issues#issue/3
    // Normally we'd just use the err object in an error case
    if (res.error || !res.rows) {
      callback(res.error);
    } else {
      var result = {};
      var count = 0;
      
      if (res.rows.length >0) {
        var doc = res.rows[0].value;
        result[doc._id] = doc;
        
        // Fetches associated objects
        function fetchAssociated(node, callback) {
          
          // Fetch children
          if (!node.children) return callback(null);
          async.forEach(node.children, function(child, callback) {
            fetchNode(child, function(err, node) {
              if (err) callback(err);
              result[node._id] = node;
              fetchAssociated(node, function(err) {
                callback(null);
              });
            });
          }, function(err) {
            callback(null);
          });
        }
        
        fetchAssociated(res.rows[0].value, function(err) {
          
          // Fetch attributes and user
          async.forEach(doc.subjects.concat(doc.entities).concat([doc.creator]), function(nodeId, callback) {
            fetchNode(nodeId, function(err, node) {
              if (err) { console.log('FATAL: BROKEN REFERENCE!'); console.log(err); return callback(); }
              result[node._id] = node;
              callback(null);
            });
          }, function(err) { 
            callback(err, result, doc._id); 
          });
        });
        
      } else {
        callback('not found');
      }
    }
  });
}


function recentDocuments(limit, username, callback) {
  db.view(db.uri.pathname+'/_design/substance/_view/recent_documents', {limit: parseInt(limit)}, function(err, res) {
    // Bug-workarount related to https://github.com/creationix/couch-client/issues#issue/3
    // Normally we'd just use the err object in an error case
  
    if (res.error || !res.rows) {
      callback(res.error);
    } else {
      var result = {};
      var associatedItems = [];
      var count = 0;
      var matched;
      _.each(res.rows, function(row) {
        // Add to result set
        if (!result[row.value._id]) count += 1;
        result[row.value._id] = row.value;
        // Include associated objects like attributes and users
        associatedItems = associatedItems.concat([row.value.creator]);
        if (row.value.subjects) associatedItems = associatedItems.concat(row.value.subjects);
        if (row.value.entities) associatedItems = associatedItems.concat(row.value.entities);
      });

      // Fetch associated items
      // TODO: make dynamic
      async.forEach(_.uniq(associatedItems), function(nodeId, callback) {
        fetchNode(nodeId, function(err, node) {
          if (err) { console.log('BROKEN REFERENCE!'); console.log(err); return callback(); }
          result[node._id] = node;
          delete result[node._id].password;
          callback();
        });
      }, function(err) { callback(err, result, count); });
    }
  });
}




// We are aware that this is not a performant solution.
// But search functionality needed to be there, quickly.
// We'll replace it with a speedy fulltext search asap.
function findDocuments(searchstr, type, username, callback) {
  db.view(db.uri.pathname+'/_design/substance/_view/documents_by_keyword', function(err, res) {
    // Bug-workarount related to https://github.com/creationix/couch-client/issues#issue/3
    // Normally we'd just use the err object in an error case
  
    if (res.error || !res.rows && _.include(["user", "keyword"], type)) {
      callback(res.error);
    } else {
      var result = {};
      var associatedItems = [];
      var count = 0;
      var matched;
      _.each(res.rows, function(row) {
        if (type === "keyword") {
          matched = row.key && row.key.match(new RegExp("("+searchstr+")", "i"));
        } else {
          matched = row.value.creator.match(new RegExp("/user/("+searchstr+")$", "i"));
        }
        
        if (matched && (row.value.published_on || row.value.creator === '/user/'+username)) {
          // Add to result set
          if (!result[row.value._id]) count += 1;
          if (count < 200) { // 200 Documents maximum
            result[row.value._id] = row.value;
            // Include associated objects like attributes and users
            associatedItems = associatedItems.concat([row.value.creator]);
            if (row.value.subjects) associatedItems = associatedItems.concat(row.value.subjects);
            if (row.value.entities) associatedItems = associatedItems.concat(row.value.entities);
          }
        }
      });
      
      if (type === 'user') {
        associatedItems.push('/user/'+searchstr.toLowerCase());
      }

      // Fetch associated items
      // TODO: make dynamic
      async.forEach(_.uniq(associatedItems), function(nodeId, callback) {
        fetchNode(nodeId, function(err, node) {
          if (err) { console.log('BROKEN REFERENCE!'); console.log(err); return callback(); }
          result[node._id] = node;
          delete result[node._id].password;
          callback();
        });
      }, function(err) { callback(err, result, count); });
    }
  });
}

var graph = new Data.Graph();

// Helpers
// -----------

var Helpers = {};

var encryptPassword = function (password) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

// Templates for the moment are recompiled every time
_.renderTemplate = function(tpl, view, helpers) {
  var source = fs.readFileSync(__dirname+ '/templates/' + tpl + '.html', 'utf-8');
  var template = Handlebars.compile(source);
  return template(view, helpers || {});
};

_.escapeHTML = function(string) {
  return string.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

// Express.js Configuration
// -----------

app.configure(function(){
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(express.cookieDecoder());
  app.use(express.session({secret: config['secret']}));
  app.use(app.router);
  app.use(express.staticProvider(__dirname+"/public", { maxAge: 41 })); // 
  app.use(express.logger({ format: ':method :url' }));
});




function clientConfig() {
  return {
    "transloadit": _.escapeHTML(JSON.stringify(config.transloadit))
  };
}

// Web server
// -----------

app.get('/', function(req, res) {
  html = fs.readFileSync(__dirname+ '/templates/app.html', 'utf-8');
  res.send(html.replace('{{{{seed}}}}', JSON.stringify(seed))
               .replace('{{{{session}}}}', JSON.stringify(req.session))
               .replace('{{{{config}}}}', JSON.stringify(clientConfig()))
               .replace(/\{\{\{\{min\}\}\}\}/g, process.argv[2] == "--production" ? '.min' : ''));
});

// Quick search interface (returns found users and a documentset)
app.get('/search/:search_str', function(req, res) {
  findDocuments(req.params.search_str, 'keyword', req.session.username, function(err, graph, count) {
    findUsers(req.params.search_str, function(err, users) {
      res.send(JSON.stringify({document_count: count, users: users}));
    });
  });
});


// Find documents by search string (full text search in future)
// Or find by user
app.get('/documents/search/:type/:search_str', function(req, res) {
  if (req.params.type == 'recent') {
    recentDocuments(req.params.search_str, req.session.username, function(err, graph, count) {
      res.send(JSON.stringify({graph: graph, count: count}));
    });
  } else {
    findDocuments(req.params.search_str, req.params.type, req.session.username, function(err, graph, count) {
      res.send(JSON.stringify({graph: graph, count: count}));
    });
  }
});


// Find documents by search string (full text search in future)
// Or find by user
app.get('/attributes', function(req, res) {
  findAttributes(req.query.member, req.query.search_str, function(err, graph) {
    res.send(JSON.stringify({graph: graph}));
  });
});

app.post('/login', function(req, res) {  
  var username = req.body.username.toLowerCase(),
      password = req.body.password;
  
  var graph = new Data.Graph(seed);
  graph.fetch({type: '/type/user'}, function(err) {
    if (!err) {
      var user = graph.get('/user/'+username);
      if (user && username === user.get('username').toLowerCase() && encryptPassword(password) === user.get('password')) {
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
  
  var graph = new Data.Graph(seed);
  if (!username || username.length === 0) {
    return res.send({"status": "error", "field": "username", "message": "Please choose a username."});
  }
  
  db.view(db.uri.pathname+'/_design/substance/_view/users', {key: username.toLowerCase()}, function(err, result) {
    // Bug-workarount related to https://github.com/creationix/couch-client/issues#issue/3
    // Normally we'd just use the err object in an error case
    if (result.error || !result.rows) return res.send({"status": "error", "field": "all", "message": "Unknown error."});
    if (result.rows.length > 0) return res.send({"status": "error", "field": "username", "message": "Username is already taken."});
    
    var user = graph.set('/user/'+username.toLowerCase(), {
      type: '/type/user',
      username: username,
      name: name,
      email: email,
      password: encryptPassword(password),
      created_at: new Date()
    });
    
    if (user.validate() && password.length >= 3) {
      graph.sync(function(err) {
        if (!err) {
          var seed = {};
          seed[user._id] = user.toJSON();
          delete seed[user._id].password;
          res.send({
            status: "ok",
            username: username.toLowerCase(),
            seed: seed
          });
          
          req.session.username = username.toLowerCase();
          req.session.seed = seed;
        } else {
          return res.send({"status": "error", "field": "all", "message": "Unknown error."});
        }
      });
    } else {
      console.log(user.errors);
      return res.send({"status": "error", "errors": user.errors, "field": "all", "message": "Validation error. Check your input."});
    }
  });
});


app.post('/updateuser', function(req, res) {
  var username = req.body.username;
  
  var graph = new Data.Graph(seed);
  graph.fetch({type: '/type/user'}, function(err) {
    var user = graph.get('/user/'+username);
    if (!user) return res.send({"status": "error"});
    
    user.set({
      name: req.body.name,
      email: req.body.email,
      location: req.body.location,
      website: req.body.website,
      company: req.body.company,
      location: req.body.location
    });
    
    // Change password
    if (req.body.password) {
      user.set({
        password: encryptPassword(req.body.password)
      });
    }

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
    } else return res.send({"status": "error", "message": "Not valid", "errors": user.errors});
  });
});


// Returns the most recent version of the requested doc
app.get('/documents/:username/:name', function(req, res) {
  getDocument(req.params.username, req.params.name, function(err, graph, id) {
    if (err) return res.send({status: "error", error: err});
    res.send({status: "ok", graph: graph, id: id});
  });
});


app.get('/readgraph', function(req, res) {
  var callback = req.query.callback,
      query = JSON.parse(req.query.qry),
      options = JSON.parse(req.query.options)
  Data.adapter.readGraph(JSON.parse(req.query.qry), new Data.Graph(), JSON.parse(req.query.options), function(err, g) {
    err ? res.send(callback+"("+JSON.stringify(err)+");")
        : res.send(callback+"("+JSON.stringify(g)+");");
  }, req);
});

app.put('/writegraph', function(req, res) {
  Data.adapter.writeGraph(req.body, function(err, g) {
    graph.merge(g); // TODO: memory leakin?
    err ? res.send(err) : res.send(JSON.stringify({"status": "ok", "graph": g}));
  }, req);
});


// The DNode Server (RMI Interface for the client)
// NOTICE: Real time authoring is disabled for the moment
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


// process.on('uncaughtException',function(error){
// // process error
// })

console.log('Loading schema...');
graph.fetch({"type|=": ["/type/type", "/type/config"]}, function(err, nodes) {
  
  if (err) {
    console.log("ERROR: Couldn't fetch schema");
    console.log(err);
  } else {
    seed = nodes.toJSON();
    console.log('READY: Substance is listening at http://'+(config['server_host'] || 'localhost')+':'+config['server_port']);
    app.listen(config['server_port'], config['server_host']);
  }
});
