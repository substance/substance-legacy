'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

// This stores operations into a hash using the manipulated path
// Example:
//
function ChangeMap() {
  PathAdapter.call(this, {});
}

ChangeMap.Prototype = function() {

  this.update = function(op) {
    var path = op.path + ['_ops'];
    var context = this._resolve(path, "create");
    context._ops = context._ops || [];
    context._ops.push(op);
  };

  this.traverse = function(fn, ctx) {
    this.__traverse(this.root, [], fn, ctx);
  };

  this.__traverse = function(level, path, fn, ctx) {
    if (level._ops && level._ops.length > 0) {
      fn.call(ctx, path, level._ops);
    }
    for (var key in level) {
      if (key === "_ops" || key === "__root__") { continue; }
      var nextLevel = level[key];
      var nextPath = path + [key];
      this.__traverse(nextLevel, nextPath, fn, ctx);
    }
  };

  this.clear = function() {
    this.root = {};
  };

};

Substance.inherit(ChangeMap, PathAdapter);

module.exports = ChangeMap;
