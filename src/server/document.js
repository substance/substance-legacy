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
  db.view('substance/recent_versions', {limit: parseInt(limit*2)}, function(err, res) {
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

    async.forEach(res.rows, function(row, callback) {
      var matched = type === "keyword" ? row.key && row.key.match(new RegExp("("+searchstr+")", "i"))
                                   : row.value.creator.match(new RegExp("/user/("+searchstr+")$", "i"));
                                   
      function add() {
        documents.push(row.value._id)
      }
                
      if (matched && documents.length < 200) {
        if (row.value.creator === '/user/'+username) {
          add(); return callback();
        } else {
          // check if published
          db.view('substance/versions', {endkey: [row.value._id], startkey: [row.value._id, {}], limit: 1, descending: true}, function(err, res) {
            if (err || res.rows.length === 0) return callback();
            add(); return callback(null, false);
          });
        }
        
      } else {
        callback();
      }
    }, function() {
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
        callback(null, result, false, res.rows[0].value._id.split('/')[3]);
      });
    }

    // Try to load specific version, or latest version, or draft (as a fallback)
    // ------------------

    function loadVersion(version, callback) {
      console.log('loading version: '+ version);
      graph.fetch({_id: "/version/"+id.split('/')[3]+"/"+version}, function(err, nodes) {
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
      loadLatestVersion(function(err, result, authorized, version) {
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
    logView(id, reader, function() {
      getViewCount(id, function(err, views) {
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