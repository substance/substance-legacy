var cradle = require('cradle@0.2.2');
var conn = new(cradle.Connection);
var db = conn.database('document_composer');
require('./lib/underscore.js');


// Set up design documents
db.insert('_design/documents', {
  all: {
    map: function (doc) {
      delete doc.contents.nodes;
      if (doc.contents) emit(doc.id, doc);
    }
  }
});

db.view('documents/all', function (err, res) {
    res.forEach(function (doc) {
      console.log(doc);
    });
});