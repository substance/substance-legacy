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
                views: {
                  "all_type_nodes": {
                    "map": "function(doc) { if (doc.type === \"/type/type\") emit(doc._id, doc); }"
                  }
                }
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
    var sharedTypes = {};
    
    // Fetches a node from the DB
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
      var types = _.isArray(node.type) ? node.type : [node.type];
      
      var properties = [];
      _.each(types, function(type) {
        _.each(result[type].properties, function(property, key) {
          properties.push({
            key: key,
            // Ensure that type property is always an array (of allowed types for the property)
            type: _.isArray(property.type) ? property.type : [property.type]
          });
        });
      });
      
      // Combine properties
      
      async.forEach(properties, function(property, callback) {
        // Assumes that a property allows either object types or value types
        if (!Data.isValueType(property.type[0])) {
          nodes = _.isArray(node[property.key]) ? node[property.key] : [node[property.key]];
          async.forEach(nodes, function(item, callback) {
            
            if (!result[item]) {
              fetchNode(item, function(err, node) {
                if (err) return callback(err);
                result[node._id] = node;
                fetchAssociated(node._id, function(err) {
                  err ? callback(err) : callback();
                });
                
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
    
    
    // First of all fetch all type nodes
    db.view(db.uri.pathname+'/_design/queries/_view/all_type_nodes', function(err, res) {
      // Bug-workarount related to https://github.com/creationix/couch-client/issues#issue/3
      // Normally we'd just use the err object in an error case
      
      if (!res.error) {
        _.each(res.rows, function(item) {
          // return item.value;
          result[item.value._id] = item.value;
        });
        
        
        // Start the fun
        query(qry, function(err, nodes) {
          if (err) return callback(err);
          _.each(nodes, function(node) {
            result[node._id] = node; // Attach node to the result graph
          });

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
           callback(null, result); // super ready
          }
        });
      } else {
        callback(res.error)
      }
    });
    
  };
  
  self.db = db;
  
  // Expose Public API
  return self;
};

module.exports = CouchAdapter;