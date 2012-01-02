// Since we introduced a new feature "Versions" we need to migrate previously published documents.

var fs = require('fs');
var assert = require('assert');
var Data = require('../../lib/data/data');
var _ = require('underscore');
var async = require('async');
var CouchClient = require('../../lib/data/lib/couch-client');

var config = JSON.parse(fs.readFileSync(__dirname+ '/../../config.json', 'utf-8'));
var seed = JSON.parse(fs.readFileSync(__dirname+ '/../schema.json', 'utf-8'));

var graph = new Data.Graph(seed, {dirty: false, syncMode: 'push'});
global.db = CouchClient(config.couchdb_url);

// Setup Data.Adapter
graph.connect('couch', { url: config.couchdb_url });

function getHeadVersion(id, callback) {
  db.view('substance/versions', {endkey: [id], startkey: [id, {}], limit: 1, descending: true}, function(err, res) {
    if (err || res.rows.length === 0) return callback('not found');
    var data = res.rows[0].value.data;
    data[id].published_on = res.rows[0].value.created_at;
    callback(null, res.rows[0].id);
  });
}

graph.fetch({"type": "/type/document"}, function(err, documents) {
  async.forEach(documents, function(doc, callback) {
    
    getHeadVersion(doc._id, function(err, version) {
      console.log(version);
      if (version) {
        doc.set({
          published_version: version
        });
      }
      callback();
    })
  }, function() {
    graph.sync(function(err) {
      console.log(graph.conflictedNodes().keys());
      console.log('synced');
      console.log(err);
    })
  });
});