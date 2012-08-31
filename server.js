var ecstatic = require('ecstatic');
var http = require('http');

http.createServer(ecstatic(__dirname)).listen(4000, '127.0.0.1');

console.log('Server running at http://127.0.0.1:4000/');