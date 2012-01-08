var _ = require('underscore');
var async = require('async');
var Data = require ('../../lib/data/data');
var Filters = require('./filters');
var Util = require('./util');


// Document
// --------------------------

var Document = {};

// Fetch a single node from the graph
function fetchNode(id, callback) {
  db.get(id, function(err, node) {
    if (err) return callback(err);
    
    // Attach to result graph
    callback(null, node);
  });
}


// Stats
// -----------


// Document usage grouped by day
function getUsage(documentId, callback) {
  db.view('substance/document_views_by_day', {group: true}, function(err, res) {
    err ? callback(err) : callback(null, res.rows);
  });
}


// There's a duplicate version in filters.js
function isAuthorized(node, username, callback) {
  if ("/user/"+username === node.creator) return callback(null, true);
  
  // Fetch list of collaborators
  db.view('substance/collaborators', {key: ["/user/"+username, node._id]}, function(err, res) {
    if (res.rows.length > 0) {
      return callback(null, res.rows[0].value.mode === "edit" ? true : false);
    } else {
      // Already published?
      db.view('substance/versions', {endkey: [node._id], startkey: [node._id, {}], limit: 1, descending: true}, function(err, res) {
        if (err || res.rows.length === 0) return callback({error: "unauthorized"});
        return callback(null, false);
      });
    }
  });
}



function fetchDocuments(documents, username, callback) {
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
  var result = {};
  
  function getHeadVersion(id, callback) {
    db.view('substance/versions', {endkey: [id], startkey: [id, {}], limit: 1, descending: true}, function(err, res) {
      if (err || res.rows.length === 0) return callback('not found');
      var data = res.rows[0].value.data;
      data[id].published_on = res.rows[0].value.created_at;
      callback(null, data[id]);
    });
  }
  
  var qry = {
    "_id": documents,
    "subjects": {},
    "entities": {},
    "creator": {}
  };
  
  graph.fetch(qry, function(err, nodes) {
    if (err) return callback(err);
    _.extend(result, nodes.toJSON());
    
    // Asynchronously fetch the right versions for the doc browser
    async.forEach(documents, function(documentId, callback) {
      getHeadVersion(documentId, function(err, head) {
        if (err) return callback(); // skip if there's no version
        isAuthorized(result[documentId], username, function(err, edit) {
          if (edit) {
            result[documentId].published_on = head.published_on;
            callback(); // skip if user has edit privileges
          } else {
            result[documentId] = head;
            callback();
          }
        });
      });
    }, function() {
      callback(null, result, documents.length);
    });
  });
}


Document.recent = function(limit, username, callback) {
  db.view('substance/recent_versions', {limit: parseInt(limit*2), descending: true}, function(err, res) {
    if (err) return callback(err);
    var documents = res.rows.map(function(d) { return d.value; });
    documents = _.select(_.uniq(documents), function(d, index) {
      return index < limit;
    });
    fetchDocuments(documents, username, callback);
  });
};


Document.subscribed = function(username, callback) {
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
  
  var qry = {
    "type": "/type/subscription",
    "user": "/user/"+username
  };
  
  graph.fetch(qry, function(err, nodes) {
    var documents = nodes.map(function(n) {
      return n.get('document')._id
    }).values();
    fetchDocuments(documents, username, callback);
  });
};


// We are aware that this is not a performant solution.
// But search functionality needed to be there, quickly.
// We'll replace it with a speedy fulltext search asap.
Document.find = function(searchstr, type, username, callback) {
  db.view('substance/documents_by_keyword', function(err, res) {
    if (err) return callback(err);
    
    var documents = [];
    function add (row) { documents.push(row.value._id); }
    
    async.forEach(res.rows, function(row, callback) {
      var matched = type === "keyword"
                  ? row.key && row.key.match(new RegExp("("+searchstr+")", "i"))
                  : row.value.creator.match(new RegExp("/user/("+searchstr+")$", "i"));
      
      if (matched && documents.length < 200) {
        if (row.value.creator === '/user/'+username) {
          add(row); return callback();
        } else {
          // check if published
          db.view('substance/versions', {endkey: [row.value._id], startkey: [row.value._id, {}], limit: 1, descending: true}, function(err, res) {
            if (err || res.rows.length === 0) return callback();
            add(row); return callback(null, false);
          });
        }
      } else {
        callback();
      }
    }, function () {
      fetchDocuments(documents, fetchDocuments, function(err, nodes, count) {
        if (type === "user" && !nodes["/user/"+searchstr]) {
          db.get("/user/"+searchstr, function(err, node) {
            if (!err) nodes[node._id] = node;
            callback(null, nodes, count);
          });
        } else {
          callback(err, nodes, count);
        }
      });
    });
  });
};

Document.dashboard = function (username, callback) {
  var userId = '/user/' + username,
      graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url}),
      bins = {
        user: {
          name: "My documents"
        },
        involved: {
          name: "Involved documents"
        },
        subscribed: {
          name: "Subscribed documents"
        }
      };

  async.parallel([
    // The user's own documents
    function (cb) {
      db.view('document/key', { startkey: [userId], endkey: [userId, {}] }, function (err, res) {
        if (err) {
          cb(err, null);
        } else {
          bins.user.documents = _.map(res.rows, function (row) { return row.value._id; });
          cb(null, bins.user.documents);
        }
      });
    },
    
    // Subscribed documents
    function (cb) {
      db.view('subscription/by_user', { key: [userId] }, function (err, res) {
        if (err) {
          cb(err, null);
        } else {
          bins.subscribed.documents = _.map(res.rows, function (row) { return row.value.document; });
          cb(null, bins.subscribed.documents);
        }
      });
    },
    
    // Documents the user has contributed to
    function (cb) {
      db.view('collaborator/by_user', { key: [userId] }, function (err, res) {
        if (err) {
          cb(err, null);
        } else {
          bins.involved.documents = _.map(res.rows, function (row) { return row.value.document; });
          cb(null, bins.involved.documents);
        }
      });
    },
    
    // Documents resulting from network memberships
    function (cb) {
      graph.fetch({type: "/type/membership", user: userId}, function(err, memberships) {
        var networks = memberships.map(function(m) { return m.get('network')._id; }).values();
        var results = [];
      
        async.forEach(networks, function(network, cb) {
          graph.fetch({type: "/type/publication", network: network }, function(err, publications) {
            bins[network] = {
              name: network,
              documents: publications.map(function(m) { return m.get('document')._id; }).values()
            };
            results = results.concat(bins[network].documents);
            cb();
          });
        }, function(err) {
          cb(null, results);
        });
      });
    }
  ], function (err, results) {
    fetchDocuments(_.uniq(_.flatten(results)), username, function(err, g, count) {
      callback(err, g, count, bins);
    });
  });
};


Document.getContent = function(documentId, callback) {
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


function loadDocument(id, version, reader, edit, callback) {
  
  var graph = new Data.Graph(seed).connect('couch', {
    url: config.couchdb_url
  });
  
  var result = {};
  var published_on = null; // based on version.created_at
  
  function load(callback) {

    // Load current Head Version
    // ------------------

    function loadHead(callback) {
      console.log("Loading head version.");
      var qry = {
        "_id": id,
        "children": {
          "_recursive": true
        }
      };
      
      graph.fetch(qry, function(err, nodes) {
        if (err) return callback(err);
        _.extend(result, nodes.toJSON());
        
        if (!nodes.get(id).get('published_version')) return callback(null, result, edit, null);
        graph.fetch({_id: nodes.get(id).get('published_version')._id}, function(err, nodes) {
          published_on = nodes.length > 0 ? nodes.first().get('created_at') : null;
          callback(null, result, edit, null);
        });
      });
    }

    // Load published version, if exists
    // ------------------

    function loadPublishedVersion(callback) {
      console.log('Loading published version.');

      graph.fetch({"type": "/type/document", "_id": id}, function(err, nodes) {
        var doc = nodes.first(),
            version = doc.get('published_version');
        if (!version) return callback('not_found');
        
        graph.fetch({"type": "/type/version", "_id": version._id}, function(err, nodes) {
          var data = nodes.first().get('data');
          data[id].published_version = doc.get('published_version')._id;
          _.extend(result, data);
          published_on = nodes.first().get('created_at');
          callback(null, result, false, nodes.first()._id.split('/')[3]);
        });
      });
    }

    // Load a specific version
    // ------------------

    function loadVersion(version, callback) {
      console.log('loading version: '+ version);

      graph.fetch({_id: "/version/"+id.split('/')[3]+"/"+version, document: {}}, function(err, nodes) {
        if (err || nodes.length === 0) return callback('not_found');

        var doc = nodes.select(function(n) {
          return n.type._id === "/type/version"
        }).first();

        var data = doc.get('data');
        data[id].published_version = doc.get('document').get('published_version')._id;
        _.extend(result, data);

        published_on = nodes.first().get('created_at');
        callback(null, result, false, version);
      });
    }

    // Start the fun
    if (edit) {
      version ? loadVersion(version, callback) : loadHead(callback);
    } else if (version) {
      loadVersion(version, callback);
    } else {
      loadPublishedVersion(function(err, result, authorized, version) {
        if (err) return loadHead(callback);
        callback(null, result, false, version);
      });
    }
  }
  
  // Attach Meta Info
  function addMetaInfo(callback) {
    
    function calcCommentCount(callback) {
      async.forEach(_.keys(result), function(nodeId, callback) {
        var node = result[nodeId];
        if (_.include(node.type, "/type/document")) return callback();
        
        db.view('comment/by_node', {key: [node._id]}, function(err, res) {
          if (!err) node.comment_count = res.rows.length;
          callback();
        });
      }, callback);
    }
    
    function fetchAttributesAndUser(callback) {
      var doc = result[id];
      graph.fetch({_id: [doc.creator].concat(doc.entities).concat(doc.subjects) }, function(err, nodes) {
        if (err) return callback();
        _.extend(result, nodes.toJSON());
        callback();
      });
    }
    
    result[id].published_on = published_on;
    
    Util.count('/counter/document/'+id.split('/')[3]+'/views', function(err, views) {
      result[id].views = views;
      // Check subscriptions
      graph.fetch({type: "/type/subscription", "document": id}, function(err, nodes) {
        if (err) return callback(err);
        result[id].subscribed = graph.find({"user": "/user/"+reader, "document": id}).length > 0 ? true : false;
        result[id].subscribers = nodes.length;
        
        calcCommentCount(function() {
          fetchAttributesAndUser(callback);
        });
      });
    });
  }
  
  load(function(err, data, authorized, version) {
    if (err) return callback(err);
    
    addMetaInfo(function() {
      // Check if already published
      // TODO: shift to authorized method, as its duplicate effort now
      db.view('substance/versions', {endkey: [id], startkey: [id, {}], limit: 1, descending: true}, function(err, res) {
        callback(null, result, edit, version, !err && res.rows.length > 0);
      });
    });
  });
}


// Get a specific version of a document from the database, including all associated content nodes
Document.get = function(username, docname, version, reader, callback) {
  db.view('substance/documents', {key: username+'/'+docname}, function(err, res) {

    if (err) return callback(err);
    if (res.rows.length == 0) return callback("not_found");
    
    var node = res.rows[0].value;
    
    isAuthorized(node, reader, function(err, edit) {
      if (err) return callback("not_authorized");
      
      loadDocument(node._id, version, reader, edit, function(err, result, edit, version, published) {
        if (err) return callback("not_found");
        callback(null, result, node._id, edit, version, published);
      });
    });
  });
};


module.exports = Document;
