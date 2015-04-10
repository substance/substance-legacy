'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

function DocumentChange(ops, before, after) {
  this.ops = ops.slice(0);
  this.before = before;
  this.after = after;
  this.index = new PathAdapter();
  this._init();
  Object.freeze(this);
  Object.freeze(this.ops);
  Object.freeze(this.index);
  Object.freeze(this.before);
  Object.freeze(this.after);
}

DocumentChange.Prototype = function() {

  this._init = function() {
    var index = this.index;

    function addOp(path, op) {
      var key = path.concat('__ops__');
      var _ops = index.get(key);
      if (!_ops) {
        _ops = [];
        index.set(key, _ops);
      }
      _ops.push(op);
    }

    Substance.each(this.ops, function(op) {
      // add each directly affected path
      addOp(op.path);
      // properties are assumed to be dirty when the op changes a 'path' property pointing to it
      if ( (op.type === "create" || op.type === "delete") && op.val.path ) {
        addOp(op.val.path);
      }
      else if (op.type === "set" && op.path[1] === 'path') {
        // The old as well the new one is affected
        addOp(op.original);
        addOp(op.val);
      }
    }, this);

  };

  this.isAffected = function(path) {
    var key = path.concat('__ops__');
    var ops = this.index.get(key);
    return ops && ops.length > 0;
  };

  this.invert = function() {
    var ops = [];
    for (var i = this.ops.length - 1; i >= 0; i--) {
      ops.push(this.ops[i].invert());
    }
    var before = this.after;
    var after = this.before;
    return new DocumentChange(ops, before, after);
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
