var express = require('express@1.0.0rc4');
var app = express.createServer();
var http = require('http');
var io = require('socket.io@0.6.1');
var cradle = require('cradle@0.2.2');
var fs = require('fs');

require('./lib/underscore.js');

// Read Config
var config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));

// Init CouchDB Connection
var conn = new(cradle.Connection)(config.couchdb.host, config.couchdb.port);
var db = conn.database(config.couchdb.db);


// Server Configuration
// -----------

app.configure(function(){
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.staticProvider(__dirname));
  app.use(express.logger({ format: ':method :url' }));
});

// Get all documents
// -----------

app.get('/documents', function(req, res) {
  db.view('documents/all', function (err, documents) {
    
    var result = documents.map(function(d) {
      return {
        id: d._id,
        title: d.contents.title,
        author: d.contents.author
      };
    });
    
    res.send(JSON.stringify(result));
  });
});


// Get all documents with contents
// -----------

app.get('/documents/full', function(req, res) {
  db.view('documents/all', function (err, documents) {
    
    var result = documents.map(function(d) {
      var res = d.contents;
      res.id = d._id;
      return res;
    });
    
    res.send(JSON.stringify(result));
  });
});

// Fetch a document
// -----------

app.get('/documents/:id', function(req, res) {
  db.get(req.params.id, function (err, doc) {
    delete doc._rev;
    doc.id = doc._id;
    delete doc._id;
    res.send(JSON.stringify(doc));
  });
});

// Create a document
// -----------

app.post('/documents', function(req, res) {
  var doc = req.body;
  
  // Store the document
  db.insert(doc, function (err, result) {
    // Handle response
    console.log(result);
    res.send(JSON.stringify({
      id: result.id
    }));
  });
});

// Update a document
// -----------

app.put('/documents/:id', function(req, res) {    
  var doc = req.body;

  db.get(req.params.id, function (err, prevdoc) {
    db.save(req.params.id, prevdoc.rev, doc, function (err, result) {
      console.log(err);
      res.send('{"status": "ok"}');
    });
  });  
});

// Delete a document
// -----------

app.del('/documents/:id', function(req, res) {
 db.get(req.params.id, function (err, prevdoc) {
   db.remove(req.params.id, prevdoc.rev, function (err, result) {
     console.log(err);
     res.send('{"status": "ok"}');
   });
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
  
  // new client is here!
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