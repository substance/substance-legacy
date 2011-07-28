var fs = require('fs');
var assert = require('assert');
var Data = require('../lib/data/data');
var _ = require('underscore');

var config = JSON.parse(fs.readFileSync(__dirname+ '/../config.json', 'utf-8'));
var seed = JSON.parse(fs.readFileSync(__dirname+ '/schema.json', 'utf-8'));

var graph = new Data.Graph(seed, {dirty: true});

// Setup Data.Adapter
graph.connect('couch', { url: config.couchdb_url, force_updates: true });

if (process.argv[2] == "--flush") {
  graph.adapter.flush(function(err) {
    console.log('DB Flushed.');
    err ? console.log(err)
        : graph.sync(function(err, invalidNodes) {
          console.log('invalidNodes:');
          if (invalidNodes) console.log(invalidNodes.keys());
          err ? console.log(err)
              : console.log('Couch seeded successfully.\nStart the server: $ node server.js');
        });
  });
} else {
  graph.sync(function(err, invalidNodes) {
    console.log('invalidNodes:');
    if (invalidNodes) console.log(invalidNodes.keys());
    
    console.log('conflictedNodes:');
    console.log(graph.conflictedNodes().keys());
    
    err ? console.log(err)
        : console.log('Couch seeded successfully.\nStart the server: $ node server.js');
  });
}