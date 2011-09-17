// Since we introduced a new feature "Versions" we need to migrate previously published documents.

var fs = require('fs');
var assert = require('assert');
var Data = require('../../lib/data/data');
var _ = require('underscore');
var CouchClient = require('../../lib/data/lib/couch-client');

var config = JSON.parse(fs.readFileSync(__dirname+ '/../../config.json', 'utf-8'));
var seed = JSON.parse(fs.readFileSync(__dirname+ '/../schema.json', 'utf-8'));

var graph = new Data.Graph(seed, {dirty: true, syncMode: 'push'});
global.db = CouchClient(config.couchdb_url);

// Setup Data.Adapter
graph.connect('couch', { url: config.couchdb_url });


getContent = function(documentId, callback) {
  var qry = {
    "_id": documentId,
    "children": {
      "_recursive": true,
    }
  };
  
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
  graph.fetch(qry, function(err, nodes) {
    var result = nodes.toJSON(),
        doc = result[documentId];

    callback(null, result, doc._id);
  });
};


// Increments or initializes a counter
function count(counterId, callback) {
  db.get(counterId, function(err, node) {
    var node = node ? node : { _id: counterId, type: ["/type/counter"] };
    node.value = err ? 1 : node.value + 1;
    
    db.save(node, function(err, node) {
      if (err) return callback(err);
      callback(null, node.value);
    });
  });
}


graph.fetch({"type": "/type/document"}, function(err, nodes) {
  var publishedDocs = nodes.select(function(n) {
    return !!n.get('published_on');
  });
  
  publishedDocs.each(function(d) {
    graph.fetch({"type": "/type/version", "document": d._id}, function(err, versions) {
      
      if (versions.length === 0) {
        getContent(d._id, function(err, data) {
          count('/counter/document/'+d._id.split('/')[3], function(err, versionCount) {

            var version = graph.set({
              _id: "/version/"+d._id.split('/')[3]+"/"+versionCount,
              type: "/type/version",
              document: d._id,
              remark: "Initial version",
              created_at: d.get('published_on'),
              data: data
            });
            console.log('saving version: '+version._id);
            graph.sync();
          });
        });
      }
    })
  });
});