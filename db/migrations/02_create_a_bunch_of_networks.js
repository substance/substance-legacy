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
    descr: "JavaScript is a prototype-based scripting language that is dynamic, weakly typed and has first-class functions. It is a multi-paradigm language, supporting object-oriented imperative, and functional programming styles.",
    color: "#82AA15",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.set({
    _id: "/network/nodejs",
    type: "/type/network",
    name: "Node.js",
    descr: "Node.js is a software system designed for writing highly-scalable internet applications, notably web servers. Programs are written in JavaScript, using event-driven, asynchronous I/O to minimize overhead and maximize scalability. Node.js consists of Google's V8 JavaScript engine plus several built-in libraries.",
    color: "#BA5219",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.set({
    _id: "/network/jazz",
    type: "/type/network",
    name: "Jazz",
    descr: "Jazz is a musical style that originated at the beginning of the 20th century in African American communities in the Southern United States. It was born out of a mix of African and European music traditions.",
    color: "#36A0A8",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.sync(function(err) {
    console.log(err);
    console.log('Created a bunch of networks.');
  });
};


createNetworks();
