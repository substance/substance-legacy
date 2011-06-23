var _ = require('underscore');
var async = require('async');
var Counter = require('./counter');
var Data = require ('../../lib/data/data')

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

function getUsage(documentId, callback) {
  db.view('substance/document_views_by_day', {group: true}, function(err, res) {
    err ? callback(err) : callback(null, res.rows);
  });
}

// Get a single document from the database, including all associated content nodes
Document.get = function(username, docname, reader, callback) {
  
  // var graph = new Data.Graph(seed, false).connect('couch', { url: config.couchdb_url});
  // var qry = {
  //   "type": "/type/document",
  //   "creator": "/user/michael",
  //   "name": "data-js",
  //   "include": ["children*", "creator", "subjects", "entities"]
  // };
  // 
  // graph.fetch(qry, function(err, nodes) {
  //   if (err) return res.send({status: "error", error: err});
  //   var result = nodes.toJSON();
  //   var comments = [];
  //   // TODO: get all comments as well
  //   res.send({status: "ok", graph: nodes.toJSON(), id: "/user/michael"});    
  // });
  
  db.view('substance/documents', {key: username+'/'+docname}, function(err, res) {
    if (err) {
      callback(err);
    } else {
      var result = {};
      var count = 0;
      
      if (res.rows.length >0) {
        var doc = res.rows[0].value;
        result[doc._id] = doc;
        
        // Fetches associated objects
        function fetchAssociated(node, callback) {
          var associated = [];
          // Fetch associated children and comments
          if (node.children) associated = associated.concat(node.children);
          if (node.comments) associated = associated.concat(node.comments);
          
          async.forEach(associated, function(child, callback) {
            fetchNode(child, function(err, node) {
              if (err) callback(err);
              result[node._id] = node;
              fetchAssociated(node, function(err) {
                callback(null);
              });
            });
          }, function(err) {
            callback(null);
          });
        }
        
        fetchAssociated(res.rows[0].value, function(err) {
          // Fetch attributes and user
          async.forEach(doc.subjects.concat(doc.entities).concat([doc.creator]), function(nodeId, callback) {
            fetchNode(nodeId, function(err, node) {
              if (err) { console.log('FATAL: BROKEN REFERENCE!'); console.log(err); return callback(); }
              result[node._id] = node;
              callback(null);
            });
          }, function(err) {
            logView(doc._id, reader, function() {
              getViewCount(doc._id, function(err, views) {
                doc.views = views;
                
                // Check for subscriptions
                var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
                graph.fetch({type: "/type/subscription", "user": "/user/"+reader, document: doc._id}, function(err, nodes) {
                  doc.subscribed = nodes.length > 0 ? true : false;
                  doc.subscribers = nodes.length;
                  callback(err, result, doc._id);
                });
              });
            });
          });
        });
        
      } else {
        callback('not found');
      }
    }
  });
}


Document.subscribed = function(username, callback) {
  var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
  var qry = {"type": "/type/subscription", "user": "/user/"+username, "_include": ["user", "document"]};
  graph.fetch(qry, function(err, graph) {
    callback(null, graph, graph.length / 2);
  });
}



Document.recent = function(limit, username, callback) {
  db.view('substance/recent_documents', {limit: parseInt(limit), descending: true}, function(err, res) {
    if (err) {
      callback(err);
    } else {
      var result = {};
      var associatedItems = [];
      var count = 0;
      var matched;
      _.each(res.rows, function(row) {
        // Add to result set
        if (!result[row.value._id]) count += 1;
        result[row.value._id] = row.value;
        // Include associated objects like attributes and users
        associatedItems = associatedItems.concat([row.value.creator]);
        if (row.value.subjects) associatedItems = associatedItems.concat(row.value.subjects);
        if (row.value.entities) associatedItems = associatedItems.concat(row.value.entities);
      });

      // Fetch associated items
      // TODO: make dynamic
      async.forEach(_.uniq(associatedItems), function(nodeId, callback) {
        fetchNode(nodeId, function(err, node) {
          if (err) { console.log('BROKEN REFERENCE!'); console.log(err); return callback(); }
          result[node._id] = node;
          delete result[node._id].password;
          callback();
        });
      }, function(err) { callback(err, result, count); });
    }
  });
}


// We are aware that this is not a performant solution.
// But search functionality needed to be there, quickly.
// We'll replace it with a speedy fulltext search asap.
Document.find = function(searchstr, type, username, callback) {
  db.view('substance/documents_by_keyword', function(err, res) {
    if (err && _.include(["user", "keyword"], type)) {
      callback(err);
    } else {
      var result = {};
      var associatedItems = [];
      var count = 0;
      var matched;
      _.each(res.rows, function(row) {
        if (type === "keyword") {
          matched = row.key && row.key.match(new RegExp("("+searchstr+")", "i"));
        } else {
          matched = row.value.creator.match(new RegExp("/user/("+searchstr+")$", "i"));
        }
        if (matched && (row.value.published_on || row.value.creator === '/user/'+username)) {
          // Add to result set
          if (!result[row.value._id]) count += 1;
          if (count < 200) { // 200 Documents maximum
            result[row.value._id] = row.value;
            // Include associated objects like attributes and users
            associatedItems = associatedItems.concat([row.value.creator]);
            if (row.value.subjects) associatedItems = associatedItems.concat(row.value.subjects);
            if (row.value.entities) associatedItems = associatedItems.concat(row.value.entities);
          }
        }
      });
      
      if (type === 'user') {
        associatedItems.push('/user/'+searchstr.toLowerCase());
      }

      // Fetch associated items
      // TODO: make dynamic
      async.forEach(_.uniq(associatedItems), function(nodeId, callback) {
        fetchNode(nodeId, function(err, node) {
          if (err) { console.log('BROKEN REFERENCE!'); console.log(err); return callback(); }
          result[node._id] = node;
          delete result[node._id].password;
          callback();
        });
      }, function(err) { callback(err, result, count); });
    }
  });
}

module.exports = Document;