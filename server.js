var express = require('express');
var app = express.createServer();
var http = require('http');
var crypto = require('crypto');
var fs = require('fs');
var Data = require('./lib/data/data');
var _ = require('underscore');
var CouchClient = require('./lib/data/lib/couch-client');
var async = require('async');

var Document = require('./src/server/document');
var Counter = require('./src/server/counter');
var User = require('./src/server/user');
var Filters = require('./src/server/filters');

// App Config
global.config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));
global.seed = JSON.parse(fs.readFileSync(__dirname+ '/db/schema.json', 'utf-8'));

// App Settings
global.settings = JSON.parse(fs.readFileSync(__dirname+ '/settings.json', 'utf-8'));
global.db = CouchClient(config.couchdb_url);

// Express.js Configuration
// -----------

app.configure(function() {
  var CookieStore = require('cookie-sessions');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(CookieStore({secret: 'keyboard cat'}));
  app.use(app.router);
  app.use(express.static(__dirname+"/public", { maxAge: 41 }));
  app.use(express.logger({ format: ':method :url' }));
});

app.configure('development', function() {
  // Expose source file in development mode
  app.use(express.static(__dirname+"/src", { maxAge: 41 }));
});


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

function getNotifications(username, callback) {
  // Read in reversed order, therefore replaced startkey with endkey
  if (!username) return callback(null, {});
  db.view('substance/notifications', {endkey: ["/user/"+username], descending: true, limit: 5}, function(err, res) {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      var result = {};
      async.forEach(res.rows, function(row, callback) {
        result[row.value._id] = row.value;
        // Fetch corresponding event
        db.get(row.value.event, function(err, event) {
          result[event._id] = event;
          callback();
        });
        
      }, function(err) {
        callback(null, result);
      });
    }
  });
}


var graph = new Data.Graph(seed);
graph.connect('couch', {
  url: config.couchdb_url,
  filters: [
    Filters.ensureAuthorized(),
    Filters.logEvents()
  ]
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
    "letterpress_url": config.letterpress_url,
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
  req.session = req.session ? req.session : {username: null};
  getNotifications(req.session.username, function(err, notifications) {
    var sessionSeed = _.extend(_.clone(seed), notifications);
    res.send(html.replace('{{{{seed}}}}', JSON.stringify(sessionSeed))
                 .replace('{{{{session}}}}', JSON.stringify(req.session))
                 .replace('{{{{config}}}}', JSON.stringify(clientConfig()))
                 .replace('{{{{scripts}}}}', JSON.stringify(scripts())));
  });
});

// Quick search interface (returns found users and a documentset)
app.get('/search/:search_str', function(req, res) {
  Document.find(req.params.search_str, 'keyword', req.session.username, function(err, graph, count) {
    User.find(req.params.search_str, function(err, users) {
      res.send(JSON.stringify({document_count: count, users: users}));
    });
  });
});

// Find documents by search string or user
app.get('/documents/search/:type/:search_str', function(req, res) {
  var username = req.session ? req.session.username : null
  if (req.params.type == 'recent') {
    Document.recent(req.params.search_str, username, function(err, graph, count) {
      res.send(JSON.stringify({graph: graph, count: count}));
    });
  } else {
    Document.find(req.params.search_str, req.params.type, username, function(err, graph, count) {
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
        
        // TODO: Include notifications
        getNotifications(username, function(err, notifications) {
          req.session = {
            username: username,
            seed: seed
          };
          
          res.send({
            status: "ok",
            username: username,
            seed: _.extend(_.clone(seed), notifications)
          });
        });
      } else {
        res.send({status: "error"});
      }
    } else {
      res.send({status: "error"});
    }
  });
});

app.post('/logout', function(req, res) {  
  req.session = {};
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

app.get('/notifications', function(req, res) {
  getNotifications(req.session.username, function(err, notifications) {
    // Only deliver unread notifications
    var unreadNotifications = {};
    _.each(notifications, function(n, key) {
      if (!n.read && _.include(n.type, "/type/notification")) {
        unreadNotifications[key] = n;
        unreadNotifications[n.event] = notifications[n.event];
      }
    });
    res.send(JSON.stringify(unreadNotifications));
  });
});

function fetchGravatar(username, size, res, callback) {
  db.get("/user/"+username, function(err, node) {
    if (err) return callback(err);
    var email = node.email || "";
    var host = 'www.gravatar.com';
    var query = "?s="+size+"&d=retro"; // (queryData && "?s=100" + queryData) || "";
    var path = '/avatar/' + crypto.createHash('md5').update(email.toLowerCase()).digest('hex') + query;

    http.get({host: host, path: path}, function(cres) {
      if (cres.statusCode !== 200) return callback('error', '');
      cres.setEncoding('binary');
      cres.on('data', function(d) {
        res.write(d, 'binary');
      });
      cres.on('end', function() {
        callback(null);
      });
    }).on('error', function(e) {
      callback(e);
    });
  });
}

app.get('/avatar/:username/:size', function(req, res) {
  res.writeHead(200, { 'Content-Type': 'image/png'});
  fetchGravatar(req.params.username, req.params.size, res, function() {
    res.end();
  });
});

// Returns the most recent version of the requested doc
app.get('/documents/:username/:name', function(req, res) {
  // var graph = new Data.Graph(seed, false).connect('couch', { url: config.couchdb_url});
  // var qry = {
  //   "type": "/type/document",
  //   "creator": "/user/michael",
  //   "name": "data-js",
  //   "include": ["children*", "creator", "subjects", "entities"]
  // };
  // 
  // graph.fetch(qry, function(err, nodes) {
  //   if (err) return res.send({status: "error", error: err});
  //   var result = nodes.toJSON();
  //   var comments = [];
  //   // TODO: get all comments as well
  //   res.send({status: "ok", graph: nodes.toJSON(), id: "/user/michael"});    
  // });
  
  Document.get(req.params.username, req.params.name, function(err, graph, id) {
    if (err) return res.send({status: "error", error: err});
    res.send({status: "ok", graph: graph, id: id});
  });
});

// Write a single document, expressed as a graph
app.post('/writedocument', function(req, res) {
  var graph = new Data.Graph(seed, false).connect('couch', { url: config.couchdb_url, force_updates: true });
  graph.merge(JSON.parse(req.rawBody), true);
  graph.sync(function(err, nodes) {
    res.send({"status": "ok"});
  });
});

console.log('READY: Substance is listening http://'+config['server_host']+':'+config['server_port']);
app.listen(config['server_port'], config['server_host']);