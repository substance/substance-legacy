var express = require('express@1.0.0rc4');
var app = express.createServer();
var http = require('http');
var cradle = require('cradle@0.2.2');
var conn = new(cradle.Connection)('mql.couchone.com', 80);
var db = conn.database('document_composer');

// Server Configuration
// -----------

app.configure(function(){
    app.use(express.bodyDecoder());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.staticProvider(__dirname));
    app.use(express.logger({ format: ':method :uri' }));
});

// Get all documents
// -----------

app.get('/documents', function(req, res) {
  db.view('documents/all', function (err, documents) {
    
    var result = documents.map(function(d) {
      return {
        id: d.id,
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
  db.view('documents/full', function (err, documents) {
    
    var result = documents.map(function(d) {
      var res = d.contents;
      res.id = d.id;
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
  var doc = JSON.parse(req.body.model);
  
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
  var doc = JSON.parse(req.body.model);
  
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
 res.send('not implemented');
});


// Start the server
// -----------

app.listen(3003);