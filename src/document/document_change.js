'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

function DocumentChange(ops, data) {
  this.ops = ops;
  this.data = data;

  this.index = new PathAdapter();
  Substance.each(ops, function(op) {
    var key = op.path.concat('__ops__');
    var _ops = this.index.get(key);
    if (!_ops) {
      _ops = [];
      this.index.set(key, _ops);
    }
    _ops.push(op);
  }, this);

  Object.freeze(this);
  Object.freeze(this.ops);
  Object.freeze(this.index);
}

DocumentChange.Prototype = function() {

  this.isAffected = function(path) {
    var key = path.concat('__ops__');
    var ops = this.index.get(key);
    return ops && ops.length > 0;
  };

  this.invert = function() {
    var ops = this.ops.map(function(op) {
      return op.invert();
    });
    return new DocumentChange(ops);
  };

  var __traverse = function(level, path, fn, ctx) {
    if (level.__ops__) {
      fn.call(ctx, path, level.__ops__);
    }
    for (var id in level) {
      if (id !== "__ops__" && level.hasOwnProperty(id)) {
        __traverse(level[id], path.concat([id]), fn, ctx);
      }
    }
  };

  this.traverse = function(fn, ctx) {
    __traverse(this.index.getRoot(), [], fn, ctx);
  };

};

Substance.initClass(DocumentChange);

module.exports = DocumentChange;
