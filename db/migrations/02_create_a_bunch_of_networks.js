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
    _id: "/network/computer_science",
    type: "/type/network",
    name: "Computer Science",
    descr: "Computer science or computing science (abbreviated CS) is the study of the theoretical foundations of information and computation. It also includes practical techniques for their implementation and application in computer systems.",
    color: "#36A0A8",
    creator: "/user/michael",
    created_at: new Date()
  });



  graph.set({
    _id: "/network/music",
    type: "/type/network",
    name: "Music",
    descr: "Music is an art form whose medium is sound and silence. Its common elements are pitch (which governs melody and harmony), rhythm (and its associated concepts tempo, meter, and articulation), dynamics, and the sonic qualities of timbre and texture.",
    color: "#82AA15",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.set({
    _id: "/network/art",
    type: "/type/network",
    name: "Art",
    descr: "Art is the product or process of deliberately arranging items (often with symbolic significance) in a way that influences and affects one or more of the senses, emotions, and intellect.",
    color: "#BA5219",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.set({
    _id: "/network/politics",
    type: "/type/network",
    name: "Politics",
    descr: "Politics (from Greek πολιτικός, \"of, for, or relating to citizens\") is a process by which groups of people make collective decisions.",
    color: "#36A0A8",
    creator: "/user/michael",
    created_at: new Date()
  });


  graph.set({
    _id: "/network/film",
    type: "/type/network",
    name: "Film",
    descr: "A film, also called a movie or motion picture, is a series of still or moving images. It is produced by recording photographic images with cameras, or by creating images using animation techniques or visual effects.",
    color: "#82AA15",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.set({
    _id: "/network/mathematics",
    type: "/type/network",
    name: "Mathematics",
    descr: "Mathematics (from Greek μάθημα máthēma \"knowledge, study, learning\") is the study of quantity, structure, space, and change. Mathematicians seek out patterns[3][4] and formulate new conjectures.",
    color: "#BA5219",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  graph.set({
    _id: "/network/physics",
    type: "/type/network",
    name: "Physics",
    descr: "Physics (from Ancient Greek: φύσις physis \"nature\") is a natural science that involves the study of matter and its motion through spacetime, along with related concepts such as energy and force.",
    color: "#36A0A8",
    creator: "/user/michael",
    created_at: new Date()
  });

  graph.set({
    _id: "/network/biology",
    type: "/type/network",
    name: "Biology",
    descr: "Biology is a natural science concerned with the study of life and living organisms, including their structure, function, growth, origin, evolution, distribution, and taxonomy.",
    color: "#82AA15",
    creator: "/user/michael",
    created_at: new Date()
  });
  
  
  graph.sync(function(err) {
    console.log(err);
    console.log('Created a bunch of networks.');
  });
};


createNetworks();
