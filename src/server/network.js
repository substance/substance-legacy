var _ = require('underscore');
var async = require('async');
var Data = require ('../../lib/data/data')
var Filters = require('./filters');
var Util = require('./util');


// Network
// --------------------------

var Network = {};

Network.get = function(network, currentUser, callback) {
	var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
  graph.fetch({type: "/type/network", _id: "/network/"+network}, function(err, nodes) {
    graph.fetch({type: "/type/publication", "network": "/network/"+network, "document": {}}, function(err, nodes) {
    	graph.fetch({"type": "/type/membership", "network": "/network/"+network, "user": {}}, function(err, nodes) {
    		callback(null, {
          graph: graph.objects().toJSON(), 
          isMember: !!nodes.get('/user/'+currentUser)
        });
    	});
    });
  });
};


Network.join = function(network, username, callback) {
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});

  graph.fetch({type: "/type/membership", network: "/network/"+network, user: "/user/"+username}, function(err, nodes) {
    if (nodes.length > 0) return callback(null);
    graph.set({
      type: "/type/membership",
      user: "/user/"+username,
      network: "/network/"+network,
      created_at: new Date()
    });
    graph.sync(callback);
  });
};


Network.leave = function(network, username, callback) {
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
  graph.fetch({type: "/type/membership", network: "/network/"+network, user: "/user/"+username}, function(err, nodes) {
    graph.del(nodes.first()._id)
    graph.sync(callback);
  });
};

module.exports = Network;
