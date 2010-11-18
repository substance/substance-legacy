var express = require('express@1.0.0rc4');
var app = express.createServer();
var http = require('http');
var io = require('socket.io@0.6.1');
var cradle = require('cradle@0.2.2');
var fs = require('fs');
var Handlebars = require('./lib/handlebars.js');
var HTMLRenderer = require('./src/renderers/frontend_renderer').Renderer;

require('./lib/underscore.js');

// Read Config
var config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));

// Init CouchDB Connection
var conn = new(cradle.Connection)(config.couchdb.host, config.couchdb.port);
var db = conn.database(config.couchdb.db);

// Helpers
// -----------

var Helpers = {};

// Templates for the moment are recompiled every time
Helpers.renderTemplate = function(tpl, view, helpers) {
  var source = fs.readFileSync(__dirname+ '/templates/' + tpl + '.html', 'utf-8');
  var template = Handlebars.compile(source);
  return template(view, helpers || {});
};


// Server Configuration
// -----------

app.configure(function(){
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.staticProvider(__dirname));
  app.use(express.logger({ format: ':method :url' }));
});


// Document Model
// -----------

var Document = {
  
  all: function(options) {
    db.view('documents/all', function (err, documents) {
      var result = documents.map(function(d) {

        if (options.withContents) {
          var res = d.contents;
          res.id = d._id;
          return res;
        } else {
          return {
            id: d._id,
            title: d.contents.title,
            author: d.contents.author
          };
        }
      });

      options.success(result);
    });
  },
  
  get: function(id, options) {
    db.get(id, function (err, doc) {
      delete doc._rev;
      doc.id = doc._id;
      delete doc._id;

      options.success(doc);
    });
  },

  create: function(doc, options) {
    db.insert(doc, function (err, result) {
      options.success(result);
    });
  },
  
  update: function(id, doc, options) {
    db.get(id, function (err, prevdoc) {
      db.save(id, prevdoc.rev, doc, function (err, result) {
        options.success();
      });
    });
  },
  
  delete: function(id, options) {
    db.get(id, function (err, prevdoc) {
      db.remove(id, prevdoc.rev, function (err, result) {
        options.success()
      });
    });
  }
};


// The Document Index
// -----------

app.get('/documents.html', function(req, res) {  
  Document.all({
    success: function(documents) {
      res.send(Helpers.renderTemplate('documents', {documents: documents}));
    }
  });
});


// Fetch a document as HTML
// -----------

app.get('/documents/:id.html', function(req, res) {
  Document.get(req.params.id, {
    withContents: true,
    success: function(doc) {
      res.send(Helpers.renderTemplate('document', {
        document: new HTMLRenderer(doc.contents).render()
      }));
    }
  });
});


// The engine room
// -----------

app.get('/', function(req, res) {
  res.send(fs.readFileSync(__dirname+ '/templates/app.html', 'utf-8'));
});


// Get all documents
// -----------

app.get('/documents', function(req, res) {
  Document.all({
    success: function(documents) {
      res.send(JSON.stringify(documents));
    }
  });
});


// Get all documents with contents
// -----------

app.get('/documents/full', function(req, res) {
  Document.all({
    withContents: true,
    success: function(documents) {
      res.send(JSON.stringify(documents));
    }
  });
});


// Fetch a document as JSON
// -----------

app.get('/documents/:id', function(req, res) {
  Document.get(req.params.id, {
    withContents: true,
    success: function(doc) {
      res.send(JSON.stringify(doc));
    }
  });
});


// Create a document
// -----------

app.post('/documents', function(req, res) {
  Document.create(req.body, {
    withContents: true,
    success: function(result) {
      res.send(JSON.stringify({id: result.id}));
    }
  });
});


// Update a document
// -----------

app.put('/documents/:id', function(req, res) {    
  var doc = req.body;
  
  Document.update(req.params.id, req.body, {
    withContents: true,
    success: function() {
      res.send('{"status": "ok"}');
    }
  });
});

// Delete a document
// -----------

app.del('/documents/:id', function(req, res) {
  Document.delete(id, {
    success: function() {
      res.send('{"status": "ok"}');
    }
  });  
});


// Start the server
// -----------

app.listen(config['server_port']);


// ContentNode Dispatcher (for realtime collaborative editing)
// -----------

var ContentNodeDispatcher = function() {
  this.clients = {}; // Keeps a reference to all client objects
  this.documents = {}; // keeps a list of id's to clients that edit that document
};


ContentNodeDispatcher.prototype.registerClient = function(client) {
  // Keep a reference to the client object
  this.clients[client.sessionId] = {
    client: client,
    id: client.sessionId,
    document: null // the document the client is currently editing
  };
};


ContentNodeDispatcher.prototype.unregisterClient = function(client) {
  var documentId = this.clients[client.sessionId].document;
  if (documentId) {
    
    // Remove the client from the list of contributors if he's editing a document
    this.documents[documentId].splice(this.documents[documentId].indexOf(client.sessionId), 1);
    
    // Unregister the document if no one is editing it any longer
    if (this.documents[documentId].length === 0) {
      delete this.documents[documentId];
    }
  }
  
  // Remove the client 
  delete this.clients[client.sessionId];
  
  this.notifyCollaborators(client.sessionId, {
    type: "exit:collaborator"
  });
};


ContentNodeDispatcher.prototype.registerDocument = function(clientId, document) {
  this.clients[clientId].document = document.id;
  
  if (this.documents[document.id]) {
    this.documents[document.id].push(clientId);
    
    this.notifyCollaborators(clientId, {
      type: "new:collaborator"
    });
  } else {
    this.documents[document.id] = [clientId];
  }
};

ContentNodeDispatcher.prototype.registerNodeChange = function(clientId, node) {
  var client = this.clients[clientId];
  var documentId = this.clients[clientId].document;
    
  this.notifyCollaborators(clientId, {
    type: "change:node",
    body: node
  });
};

// Send message to all collaborators (except the original sender of the message)
ContentNodeDispatcher.prototype.notifyCollaborators = function(clientId, msg) {
  _.each(this.clients, function(client, key) {
    if (client.client.sessionId !== clientId) {
      client.client.send(msg);
    }
  });
};


var dispatcher = new ContentNodeDispatcher();

var socket = io.listen(app); 
socket.on('connection', function(client) {
  dispatcher.registerClient(client);
  
  // New client is here!
  client.on('message', function(msg) { 
    if (msg.type === 'register') {
      dispatcher.registerDocument(client.sessionId, msg.body);
    } else if (msg.type === 'change:node') {
       dispatcher.registerNodeChange(client.sessionId, msg.body);
    }
  });
  
  client.on('disconnect', function() {
    dispatcher.unregisterClient(client);
  });
});