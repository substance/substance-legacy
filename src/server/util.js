var _ = require('underscore');

var Util = {};
Util.count = function(counterId, callback) {
  db.get(counterId, function(err, node) {
    var node = node ? node : { _id: counterId, type: ["/type/counter"] };
    node.value = err ? 1 : node.value + 1;
    
    db.save(node, function(err, node) {
      if (err) return callback(err);
      callback(null, node.value);
    });
  });
};

module.exports = Util;