var _ = require('underscore');
var async = require('async');
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
    res.rows.length > 0 ? callback(null, res.rows[0].value.mode === "edit" ? true : false) : callback({error: "unauthorized"});
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

// Get a single document from the database, including all associated content nodes
// Document.get = function(username, docname, reader, callback) {
//   db.view('substance/documents', {key: username+'/'+docname}, function(err, res) {
//     var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
//     
//     if (err) return callback(err);
//     if (res.rows.length == 0) return callback("not_found");
//     
//     var node = res.rows[0].value;
//     
//     function load(mode) {
//       var id = res.rows[0].value._id;
// 
//       var qry = {
//         "_id": id,
//         "children": {
//           "_recursive": true,
//           "comments": {}
//         },
//         "subjects": {},
//         "entities": {},
//         "creator": {}
//       };
// 
//       graph.fetch(qry, function(err, nodes) {
//         var result = nodes.toJSON(),
//             doc = result[id];
// 
//         logView(doc._id, reader, function() {
//           getViewCount(doc._id, function(err, views) {
//             doc.views = views;
//             // Check subscriptions
//             graph.fetch({type: "/type/subscription", "document": doc._id}, function(err, nodes) {
//               if (err) return callback(err);
//               doc.subscribed = graph.find({"user": "/user/"+reader, "document": doc._id}).length > 0 ? true : false;
//               doc.subscribers = nodes.length;
//               callback(null, result, doc._id, mode);
//             });
//           });
//         });
//       });
//     }
//     
//     isAuthorized(node, reader, function(err, mode) {
//       if (err && !node.published_on) return callback("not_authorized");
//       load(mode);
//     });
//   });
// };







// Get a specific version of a document from the database, including all associated content nodes
Document.get = function(username, docname, version, reader, callback) {
  db.view('substance/documents', {key: username+'/'+docname}, function(err, res) {
    var graph = new Data.Graph(seed).connect('couch', {url: config.couchdb_url});
    
    if (err) return callback(err);
    if (res.rows.length == 0) return callback("not_found");
    
    var node = res.rows[0].value;
    
    // function fetchRecent(docId, callback) {
    //   db.view('substance/versions', {endkey: [docId], startkey: [docId, {}], limit: 10, descending: true}, function(err, res) {
    //     if (err) return callback(err);
    //     // fetchDocuments(res.rows.map(function(d) { return d.id }), callback);
    //     console.log("MEEH");
    //     _.each(res.rows, function(row) {
    //       console.log(row.key);
    //     });
    //   });
    // }
    
    // function load(authorized) {
    //   var id = res.rows[0].value._id;
    //   
    //   if (!version && authorized) {
    //     console.log('authorized but no version');
    //     var qry = {
    //       "_id": id,
    //       "children": {
    //         "_recursive": true,
    //         "comments": {}
    //       },
    //       "subjects": {},
    //       "entities": {},
    //       "creator": {}
    //     };
    //   } else {
    //     var qry = {
    //       "_id": id,
    //       "subjects": {},
    //       "entities": {},
    //       "creator": {}
    //     };
    //   }
    // 
    //         
    //   graph.fetch(qry, function(err, nodes) {
    //     var result = nodes.toJSON(),
    //         doc = result[id];
    // 
    //     logView(doc._id, reader, function() {
    //       getViewCount(doc._id, function(err, views) {
    //         var meta = {
    //           views: views
    //         };
    //         
    //         // Check subscriptions
    //         graph.fetch({type: "/type/subscription", "document": doc._id}, function(err, nodes) {
    //           if (err) return callback(err);
    //           meta.subscribed = graph.find({"user": "/user/"+reader, "document": doc._id}).length > 0 ? true : false;
    //           meta.subscribers = nodes.length;
    //           
    //           if (version) {
    //             console.log('HAHA');
    //             
    //             // Use published version
    //             graph.fetch({_id: "/version/"+version}, function(err, nodes) {
    //               var data = nodes.first().get('data');
    //               _.extend(result, data);
    //               _.extend(result[id], meta); // Attach meta information
    // 
    //               callback(null, result, doc._id, false);
    //             });
    //           } else {
    //             if (!authorized) {
    //               console.log('FETCH MOST RECENT VERSION!');
    //               
    //               fetchRecent(id, function(err, data) {
    //                 _.extend(result, data);
    //                 _.extend(result[id], meta); // Attach meta information
    //               })
    //             }
    //             // TODO: Fetch latest version if not the author!
    //             _.extend(result[id], meta); // Attach meta information
    //             callback(null, result, doc._id, authorized);
    //           }
    //           
    //           
    //           
    //         });
    //       });
    //     });
    //   });
    // }
    
    
    
    
    
    
    function loadDocument(id, version, edit, callback) {

      var result = {};

      // Load current Head Version
      // ------------------

      function loadHead(callback) {
        console.log("Loading head version");
        var qry = {
          "_id": id,
          "children": {
            "_recursive": true,
            "comments": {}
          },
          "subjects": {},
          "entities": {},
          "creator": {}
        };
        
        graph.fetch(qry, function(err, nodes) {
          if (err) return callback(err);
          callback(null, nodes.toJSON(), edit);
        });
      }

      // Load latest version, if exists
      // ------------------

      function loadLatestVersion(callback) {
        console.log('Loading latest version');
        db.view('substance/versions', {endkey: [id], startkey: [id, {}], limit: 1, descending: true}, function(err, res) {
          if (err) return callback(err);
          _.extend(result, res.rows[0].value.data);
          callback(null, result, false);
        });
      }

      // Try to load specific version, or latest version, or draft (as a fallback)
      // ------------------

      function loadVersion(version, callback) {
        console.log('loading version: '+ version);
        graph.fetch({_id: "/version/"+version}, function(err, nodes) {
          var data = nodes.first().get('data');
          _.extend(result, data);
        
          callback(null, result, id, false);
        });
      }
      
      // Start the fun
      if (edit) {
        version ? loadVersion(version, callback) : loadHead(callback);
      } else if (version) {
        loadVersion(version, callback);
      } else {
        loadLatestVersion(function(err) {
          if (err) return loadHead(callback);
          callback(null, result, false);
        });
      }
    }
    
    isAuthorized(node, reader, function(err, edit) {
      if (err && !node.published_on) return callback("not_authorized");
      loadDocument(node._id, version, edit, function(err, result, edit) {
        // in the case of a version fetched by an author, edit should be set to false!
        callback(null, result, node._id, edit);
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