var _ = require('underscore');
var async = require('async');
var Data = require ('../../lib/data/data')
var Filters = require('./filters');
var Util = require('./util');


// Network
// --------------------------

var Network = {};

Network.get = function(network, callback) {
	var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
  graph.fetch({type: "/type/network", _id: "/network/"+network}, function(err, nodes) {
    graph.fetch({type: "/type/publication", "network": "/network/"+network, "document": {}}, function(err, nodes) {
    	graph.fetch({"type": "/type/membership", "network": "/network/"+network, "user": {}}, function(err, nodes) {
    		callback(null, graph.objects().toJSON());
    	});
    });
  });
};

module.exports = Network;