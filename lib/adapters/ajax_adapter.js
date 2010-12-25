var AjaxAdapter = function(config) {
  // var db = CouchClient(config.url);
  // var self = {};
  // 
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

  // Generate a unique id that can be used for storing documents
  self.uuid = function(callback) {
    // db.request("GET", "_uuids", function (err, res) {
    //   err ? callback(err) : 'FOO';
    // });
    return "_some_id";
  };

  // flush
  // --------------

  // Flush the database
  self.flush = function(callback) {
    console.log('flushing DB');
  };
  
  
  // writeGraph
  // --------------

  // Takes a Data.Graph and persists it to CouchDB
  
  self.writeGraph = function(graph, callback) {
    console.log('writing graph');
    // function writeNode(nodeId, callback) {
    //   var target = _.extend(graph[nodeId], {
    //     _id: nodeId
    //   });
    //   
    //   db.save(target, function (err, doc) {
    //     err ? callback(err) : callback();
    //   });
    // }
    // 
    // async.forEach(Object.keys(graph), writeNode, function(err) {
    //   err ? callback(err) : callback();
    // });
  };
  
  // readGraph
  // --------------

  // Takes a query object and reads all matching nodes
  // If you'd like to make a deep fetch, you just need to specify
  // expand: true in the options hash
  
  self.readGraph = function(qry, targetGraph, options, callback) {    
    $.ajax({
      type: "GET",
      url: "/readgraph.json",
      data: {
        qry: JSON.stringify(qry),
        options: JSON.stringify(options)
      },
      dataType: "json",
      success: function(graph) {
       callback(null, graph);
      },
      error: function(err) {
       callback(err);
      }
    });
  };
  
  // Expose Public API
  return self;
};
