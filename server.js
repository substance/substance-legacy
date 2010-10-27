var express = require('express@1.0.0rc4');
var app = express.createServer();
var http = require('http');
var cradle = require('cradle@0.2.2');
var conn = new(cradle.Connection);
var db = conn.database('content_graph');

// Fetch a document
app.get('/documents/:id', function(req, res) {
  db.get('13feb29428bf9f4058a628f238000a91', function (err, doc) {
    res.send(JSON.stringify(doc));
  });  
});

// Update a document
app.put('/documents/:id', function(req, res) {
 res.send('not implemented');
});

// Delete a document
app.put('/documents/:id', function(req, res) {
 res.send('not implemented');
});

// Get all documents
app.get('/documents', function(req, res) {
  res.send('not implemented....');
});

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyDecoder());
    app.use(app.router);
    app.use(express.staticProvider(__dirname));
});

app.listen(3003);