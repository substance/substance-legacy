var _ = require('underscore');
var async = require('async');
var Data = require ('../../lib/data/data')
var Filters = require('./filters');


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

function logView(documentId, username, callback) {
  db.save({
    _id: Data.uuid("/event/"),
    type: ["/type/event"],
    event_type: "view-document",
    creator: username ? "/user/"+username : null,
    message: "",
    link: "",
    object: documentId,
    created_at: new Date()
  }, function(err, event) {
    callback();
  });
}


function getViewCount(documentId, callback) {
  db.view('substance/document_views', {key: documentId}, function(err, res) {
    if (err) {
      callback(err);
    } else {
      callback(null, res.rows[0].value);
    }
  });
}

// Document usage grouped by day
function getUsage(documentId, callback) {
  db.view('substance/document_views_by_day', {group: true}, function(err, res) {
    err ? callback(err) : callback(null, res.rows);
  });
}


function fetchDocuments(documents, callback) {
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});

  var qry = {
    "_id": documents,
    "subjects": {},
    "entities": {},
    "creator": {}
  };
  
  graph.fetch(qry, function(err, nodes) {
    if (err) return callback(err);
    callback(null, nodes.toJSON(), documents.length);
  });
}

Document.recent = function(limit, username, callback) {
  db.view('substance/recent_documents', {limit: parseInt(limit), descending: true}, function(err, res) {
    if (err) return callback(err);
    fetchDocuments(res.rows.map(function(d) { return d.id }), callback);
  });
};


// We are aware that this is not a performant solution.
// But search functionality needed to be there, quickly.
// We'll replace it with a speedy fulltext search asap.
Document.find = function(searchstr, type, username, callback) {
  db.view('substance/documents_by_keyword', function(err, res) {
    if (err) return callback(err);
    var documents = [];
    _.each(res.rows, function(row) {
      var matched = type === "keyword" ? row.key && row.key.match(new RegExp("("+searchstr+")", "i"))
                                   : row.value.creator.match(new RegExp("/user/("+searchstr+")$", "i"));
                                   
      if (matched && (row.value.published_on || row.value.creator === '/user/'+username)
                  && documents.length < 200) documents.push(row.value._id);
    });
    fetchDocuments(documents, function(err, nodes, count) {
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
};


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


// Get a specific version of a document from the database, including all associated content nodes
Document.get = function(username, docname, version, reader, callback) {
  db.view('substance/documents', {key: username+'/'+docname}, function(err, res) {
    var graph = new Data.Graph(seed).connect('couch', {
      url: config.couchdb_url
    });
    
    if (err) return callback(err);
    if (res.rows.length == 0) return callback("not_found");
    
    var node = res.rows[0].value;
    
    function loadDocument(id, version, edit, callback) {
      
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
              // "comments": {}
            },
            "subjects": {},
            "entities": {},
            "creator": {}
          };
          
          graph.fetch(qry, function(err, nodes) {
            if (err) return callback(err);
            _.extend(result, nodes.toJSON());
            callback(null, result, edit, null);
          });
        }

        // Load latest version, if exists
        // ------------------

        function loadLatestVersion(callback) {
          console.log('Loading latest version.');
          db.view('substance/versions', {endkey: [id], startkey: [id, {}], limit: 1, descending: true}, function(err, res) {
            if (err || res.rows.length === 0) return callback('not_found');
            _.extend(result, res.rows[0].value.data);
            published_on = res.rows[0].value.created_at;
            callback(null, result, false, res.rows[0].value._id.split('/')[2]);
          });
        }

        // Try to load specific version, or latest version, or draft (as a fallback)
        // ------------------

        function loadVersion(version, callback) {
          console.log('loading version: '+ version);
          graph.fetch({_id: "/version/"+node._id.split('/')[3]+"/"+version}, function(err, nodes) {
            if (err || nodes.length === 0) return callback('not_found');
            var data = nodes.first().get('data');
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
          loadLatestVersion(function(err, version) {
            if (err) return loadHead(callback);
            callback(null, result, false);
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
        
        result[node._id].published_on = published_on;
        logView(node._id, reader, function() {
          getViewCount(node._id, function(err, views) {
            result[node._id].views = views;
            
            // Check subscriptions
            graph.fetch({type: "/type/subscription", "document": node._id}, function(err, nodes) {
              if (err) return callback(err);
              result[node._id].subscribed = graph.find({"user": "/user/"+reader, "document": node._id}).length > 0 ? true : false;
              result[node._id].subscribers = nodes.length;
              
              calcCommentCount(callback);
            });
          });
        });
      }
      
      load(function(err, data, authorized, version) {
        if (err) return callback(err);
        
        addMetaInfo(function() {
          // Check if already published
          // TODO: shift to authorized method, as its duplicate effort now
          db.view('substance/versions', {endkey: [node._id], startkey: [node._id, {}], limit: 1, descending: true}, function(err, res) {
            callback(null, result, edit, version, !err && res.rows.length > 0);
          });
        });
      });
    }
    
    isAuthorized(node, reader, function(err, edit) {
      if (err) return callback("not_authorized");
      
      loadDocument(node._id, version, edit, function(err, result, edit, version, published) {
        if (err) return callback("not_found");
        callback(null, result, node._id, edit, version, published);
      });
    });
  });
};


Document.subscribed = function(username, callback) {
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
  
  var qry = {
    "type": "/type/subscription",
    "user": "/user/"+username,
    "document": {
      "creator": {},
      "children": {"_recursive": true},
      "subjects": {},
      "entities": {}
    }
  };
  
  graph.fetch(qry, function(err, nodes) {
    callback(null, nodes.toJSON(), graph.find({"type": "/type/subscription"}).length);
  });
};

module.exports = Document;