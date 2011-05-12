var express = require('express');
var app = express.createServer();
var http = require('http');
var crypto = require('crypto');
var fs = require('fs');
var Data = require('./lib/data/data');
var _ = require('underscore');
var CouchClient = require('./lib/data/lib/couch-client');
var async = require('async');

// App Config
global.config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));
global.seed = JSON.parse(fs.readFileSync(__dirname+ '/db/schema.json', 'utf-8'));

// App Settings
global.settings = JSON.parse(fs.readFileSync(__dirname+ '/settings.json', 'utf-8'));

var db = CouchClient(config.couchdb_url);

// Express.js Configuration
// -----------

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: config['secret']}));
  app.use(app.router);
  app.use(express.static(__dirname+"/public", { maxAge: 41 }));
  app.use(express.logger({ format: ':method :url' }));
});

app.configure('development', function() {
  // Expose source file in development mode
  app.use(express.static(__dirname+"/src", { maxAge: 41 }));
});

// Fetch a single node from the graph
function fetchNode(id, callback) {
  db.get(id, function(err, node) {
    if (err) return callback(err);
    
    // Attach to result graph
    callback(null, node);
  });
}

function findAttributes(member, searchstr, callback) {
  db.view('substance/attributes', {key: member}, function(err, res) {
    if (err) {
      callback(err);
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
  db.view('substance/users', function(err, res) {
    // Bug-workarount related to https://github.com/creationix/couch-client/issues#issue/3
    // Normally we'd just use the err object in an error case
  
    if (err) {
      callback(err);
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
  db.view('substance/documents', {key: username+'/'+docname}, function(err, res) {
    if (err) {
      callback(err);
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
  db.view('substance/recent_documents', {limit: parseInt(limit), descending: true}, function(err, res) {
    if (err) {
      callback(err);
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
  db.view('substance/documents_by_keyword', function(err, res) {
    if (err && _.include(["user", "keyword"], type)) {
      callback(err);
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

// Middleware for graph read and write operations
var Filters = {};
Filters.ensureAuthorized = function() {
  return {
    read: function(node, next, session) {
      // Hide all password properties
      delete node.password;      
      next(node);
    },

    write: function(node, next, session) {
      var that = this;
      
      if (_.include(node.type, "/type/document")) {
        return node.creator !== "/user/"+session.username ? next(null) : next(node);
        // TODO: Make sure that document deletion can only be done by the creator, not the collaborators.
      } else if (_.intersect(node.type, ["/type/section", "/type/visualization", "/type/text",
                                         "/type/question", "/type/answer", "/type/quote", "/type/image", "/type/reference"]).length > 0) {

        that.db.get(node.document, function(err, document) {
          if (err) return next(node); // if the document does not yet exist
          return document.creator !== "/user/"+session.username ? next(null) : next(node);
        });
      } else if (_.include(node.type, "/type/user")) {
        // Ensure username can't be changed for existing users
        that.db.get(node._id, function(err, user) {
          if (err) return next(null);
          
          if (node._rev) node.username = user.username;
          next(node);
        });
      } else {
        next(node);
      }
    }
  };
};


var graph = new Data.Graph(seed);
graph.connect('couch', {
  url: config.couchdb_url,
  filters: [Filters.ensureAuthorized()]
});

// Serve Data.js backend along with an express server
graph.serve(app);

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


function clientConfig() {
  return {
    "transloadit": _.escapeHTML(JSON.stringify(config.transloadit))
  };
}

function scripts() {
  if (process.env.NODE_ENV === 'production') {
    return settings.scripts.production;
  } else {
    return settings.scripts.development.concat(settings.scripts.source);
  }
}

// Web server
// -----------

app.get('/', function(req, res) {
  html = fs.readFileSync(__dirname+ '/templates/app.html', 'utf-8');
  res.send(html.replace('{{{{seed}}}}', JSON.stringify(seed))
               .replace('{{{{session}}}}', JSON.stringify(req.session))
               .replace('{{{{config}}}}', JSON.stringify(clientConfig()))
               .replace('{{{{scripts}}}}', JSON.stringify(scripts())));
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
  if (req.params.type == 'recent') {
    recentDocuments(req.params.search_str, req.session.username, function(err, graph, count) {
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
  
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
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
  
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
  if (!username || username.length === 0) {
    return res.send({"status": "error", "field": "username", "message": "Please choose a username."});
  }
  
  db.view('substance/users', {key: username.toLowerCase()}, function(err, result) {
    if (err) return res.send({"status": "error", "field": "all", "message": "Unknown error."});
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
  
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
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

// Write a single document, expressed as a graph
// app.post('/writedocument', function(req, res) {
//   var graph = new Data.Graph(seed, false).connect('couch', { url: config.couchdb_url, force_updates: true });
//   graph.merge(JSON.parse(req.rawBody), true);
//   graph.sync(function(err, nodes) {
//     res.send({"status": "ok"});
//   });
// });

console.log('READY: Substance is listening http://'+config['server_host']+':'+config['server_port']);
app.listen(config['server_port'], config['server_host']);