var fs = require('fs');
var assert = require('assert');
var Data = require('../../lib/data/data');
var _ = require('underscore');
var async = require('async');
var CouchClient = require('../../lib/data/lib/couch-client');

var config = JSON.parse(fs.readFileSync(__dirname+ '/../../config.json', 'utf-8'));
var seed = JSON.parse(fs.readFileSync(__dirname+ '/../schema.json', 'utf-8'));

var graph = new Data.Graph(seed, {syncMode: 'push'});
global.db = CouchClient(config.couchdb_url);


// Setup Data.Adapter
graph.connect('couch', { url: config.couchdb_url });

function createNetworks(callback) {
  
  graph.set({
    _id: "/network/javascript",
    type: "/type/network",
    name: "Javascript",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.set({
    _id: "/network/nodejs",
    type: "/type/network",
    name: "Node.js",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.set({
    _id: "/network/jazz",
    type: "/type/network",
    name: "Jazz",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.sync(function(err) {
    console.log(err);
    console.log('Created a bunch of networks.');
  });
  
};


createNetworks();
