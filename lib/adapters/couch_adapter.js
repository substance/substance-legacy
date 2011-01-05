var CouchClient = require('couch-client');
var Data = require('../data');
var _ = require('underscore');
var async = require('async');

var CouchAdapter = function(config, callback) {
  var db = CouchClient(config.url);
  var self = {};
  
  function serializeQuery(qry) {
    var queryHash = new Data.Hash(qry).sort(Data.Comparators.ASC);
    var queryProperties = [];
    queryHash.each(function(value, property) {
      queryProperties.push(property + "=" + value);
    });
    return queryProperties.join(":").replace(/\//g, '.');
  }
  

  // flush
  // --------------

  // Flush the database
  self.flush = function(callback) {
    // Delete DB if exists
    db.request("DELETE", db.uri.pathname, function (err) {
      db.request("PUT", db.uri.pathname, function(err) {
        err ? callback(err) 
            : db.save({
                _id: '_design/queries',
                views: {}
              }, function (err, doc) {
                err ? callback(err) : callback();
              });
      });
    });
  };
  
  
  // writeGraph
  // --------------

  // Takes a Data.Graph and persists it to CouchDB
  
  self.writeGraph = function(graph, callback) {
        
    function writeNode(nodeId, callback) {
      var target = _.extend(graph[nodeId], {
        _id: nodeId
      });
      
      db.save(target, function (err, doc) {
        err ? callback(err) : callback();
      });
    }
    
    async.forEach(Object.keys(graph), writeNode, function(err) {
      err ? callback(err) : callback();
    });
  };
  
  
  // readGraph
  // --------------

  // Takes a query object and reads all matching nodes
  // If you'd like to make a deep fetch, you just need to specify
  // expand: true in the options hash
  
  self.readGraph = function(qry, targetGraph, options, callback) {
    
    // Collects the subgraph that will be returned as a result
    var result = {};
    
    // Reads a node and the related type node
    // --------
    
    function fetchNode(id, callback) {
      db.get(id, function(err, node) {
        if (err) return callback(err);
        
        // Attach to result graph
        result[node._id] = node;
        callback(null, node);
      });
    }
    
    // Performs a query and returns a list of matched nodes
    // --------

    function query(qry, callback) {
      
      if (!qry) throw "No query specified";
      
      function executeQuery(qry, callback) {
        var viewId = serializeQuery(qry);
        db.view(db.uri.pathname+'/_design/queries/_view/'+viewId, function(err, res) {
          // Bug-workarount related to https://github.com/creationix/couch-client/issues#issue/3
          // Normally we'd just use the err object in an error case
          res.error ? callback(res.error) : callback(null, _.map(res.rows, function(item) {
            return item.value;
          }));
        });
      };
      
      function createQuery(qry, callback) {
        var viewId = serializeQuery(qry);
        
        db.get('_design/queries', function(err, node) {
          if (!err) {
            // Dynamically generate a view function
            var conditions = [];
            var fn = "function(doc) { if (##conditions##) emit(doc._id, doc); }";
            
            _.each(qry, function(value, key) {
              // Extract operator
              var matches = key.match(/^([a-z_]{1,30})(!=|>|>=|<|<=|\|=)?$/),
                  property = matches[1],
                  operator = matches[2] || '==';
              
              if (operator === "|=") { // one of operator
                var values = _.isArray(value) ? value : [value];
                var subconditions = [];
                _.each(values, function(val) {
                  subconditions.push("doc."+property+".indexOf(\""+val+"\") >= 0");
                });
                conditions.push("("+subconditions.join(' || ')+")");
              } else { // regular operators
                conditions.push("doc."+property+" "+operator+" "+(typeof value === "string" ? "\""+value+"\"": value));
              }
            });
            
            fn = fn.replace('##conditions##', conditions.join(' && '));
            
            node.views[viewId] = { map: fn };
            db.save(node, function(err, doc) {
              err ? callback('Error during saving the view') : callback();
            });
          } else {
            throw('_design/queries not found.');
          }
        });
      }
      
      async.waterfall([
        // Query view
        function(callback) {
          executeQuery(qry, function(err, matchedNodes) {
            err ? callback(null,false, null) : callback(null, true, matchedNodes);
          });
        },

        // Create a view if not exists
        function(done, matchedNodes, callback) {
          if (done) return callback(null, matchedNodes);
          createQuery(qry, function(err) {
            if (err) return callback('Error during view creation');
            // And now execute it.
            executeQuery(qry, function(err, matchedNodes) {
              err ? callback(err) : callback(null, matchedNodes);
            });
          });
        }
      ], function(err, matchedNodes) {
        err ? callback(err) : callback(null, matchedNodes);
      });
    };
    
    
    // Fetches associated objects
    function fetchAssociated(nodeKey, callback) {
      
      // Assumes that corresponding type nodes are already there
      var node = result[nodeKey];
      var type = result[node.type];
      
      async.forEach(Object.keys(type.properties), function(propertyKey, callback) {
        var property = type.properties[propertyKey];
        
        if (!Data.isValueType(property.expected_type)) {
          nodes = _.isArray(node[propertyKey]) ? node[propertyKey] : [node[propertyKey]];
          async.forEach(nodes, function(item, callback) {
            
            if (!result[item]) {
              fetchNode(item, function(err, node) {
                if (err) return callback(err);
                result[node._id] = node;
                
                // Fetch corresponding type node
                if (!result[node.type]) {
                  fetchNode(node.type, function(err, typeNode) {
                    if (err) return callback(err);
                    result[typeNode._id] = typeNode;
                    
                    // Go deeper
                    fetchAssociated(node._id, function(err) {
                      err ? callback(err) : callback();
                    });
                  });
                } else {
                  // Go deeper
                  fetchAssociated(node._id, function(err) {
                    err ? callback(err) : callback();
                  });
                }
              }); 
            } else {
              callback();
            }
          }, function(err) { callback(); });
          
        } else { callback(); }
      }, function(err) {
        // All properties resolved
        callback();
      });
    }
    
    // Start the fun
    query(qry, function(err, nodes) {
      types = {};
      
      if (err) return callback(err);
      
      _.each(nodes, function(node) {
        // Attach node to the result graph
        result[node._id] = node;
        
        // Unless type node, collect type for schema purposes
        if (node.type !== "type" && node.type !== "/type/type" && !result[node.type]) {
          types[node.type] = node.type;
        }
      });
      
      // Fetch all referenced type nodes in parallel
      async.forEach(Object.keys(types), function(item, callback) {
        fetchNode(item, function(err, typeNode) {
          if (err) return callback(err);
          result[typeNode._id] = typeNode;
          callback();
        });
      }, function(err) {
        if (err) return callback(err);
        
        // Prefetch associated nodes
        if (options.expand) {          
          async.forEach(Object.keys(result), function(item, callback) {
            if (result[item].type !== 'type' && result[item].type !== '/type/type') {
              fetchAssociated(item, function(err) {
                err ? callback('error during fetching assciated nodes') : callback();
              });
            } else {
              callback();
            }
          }, function(err) { callback(null, result); });
        } else {
         callback(null, result);
        }
      });
    });
  };
  
  self.db = db;
  
  // Expose Public API
  return self;
};

module.exports = CouchAdapter;