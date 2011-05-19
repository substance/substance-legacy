// A generic counter interface (stub)
// --------------------------

var Counter = {}

Counter.get = function(obj, counterName, cb) {
  cb(null, 5);
};

Counter.increment = function(obj, counterName, cb) {
  // read old counter, increment, return incremented value and store new value
  cb(null, 13);
};

Counter.decrement = function(obj, counterName, cb) {
  cb(null, 13);
};

module.exports = Counter;