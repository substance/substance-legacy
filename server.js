var ecstatic = require('ecstatic');
var http = require('http');

var fs      = require('fs');
var Library   = require('library');

// Starts listening automatically
var library = new Library(3100);

// Server some static files
http.createServer(ecstatic(__dirname)).listen(4000, '127.0.0.1');
console.log('Server running at http://127.0.0.1:4000/');