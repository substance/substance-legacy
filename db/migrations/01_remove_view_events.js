// Migration guide
// -----------
// 
// 1. Run `cake couch:push` to create document_views_raw view
// 2. Execute this script

var fs = require('fs');
var assert = require('assert');
var Data = require('../../lib/data/data');
var _ = require('underscore');
var async = require('async');
var CouchClient = require('../../lib/data/lib/couch-client');

var config = JSON.parse(fs.readFileSync(__dirname+ '/../../config.json', 'utf-8'));
var seed = JSON.parse(fs.readFileSync(__dirname+ '/../schema.json', 'utf-8'));

var graph = new Data.Graph(seed, {dirty: true, syncMode: 'push'});
global.db = CouchClient(config.couchdb_url);

// Setup Data.Adapter
graph.connect('couch', { url: config.couchdb_url });

function saveCount(counterId, value, callback) {
  db.get(counterId, function(err, node) {
    var node = {
      _id: counterId,
      type: ["/type/counter"],
      value: value
    };
    db.save(node, function(err, node) {
      if (err) return callback(err);
      callback(null, node.value);
    });
  });
}


function removeViewEvents(callback) {
  // callback();
  db.view('substance/document_views_raw', {}, function(err, res) {
    console.log('Deleting '+ res.rows.length+ ' rows...');
    res.rows.forEach(function(row) {
      db.save({ _id: row.id, _rev: row.value, _deleted: true }, function() {
        console.log('deleted'+row.id);
      });
    });
    callback();
  });
}


function computeCounters(callback) {
  graph.fetch({"type": "/type/document"}, function(err, documents) {
    // var count = 0;
    async.forEach(documents, function(document, callback) {
      
      // count ++;
      db.view('substance/document_views', {key: document._id}, function(err, res) {
      
        var views = res.rows[0] ? res.rows[0].value : 0;
        saveCount("/counter/document/"+document._id+"/views", views, function() {
          console.log('saved');
          callback();
        });
        
      });
    }, function() {
      callback();
    });
    
    // documents.each(function(document) {

    // });
  });
}

// Start the fun
async.series([
  // computeCounters,
  removeViewEvents
]);
