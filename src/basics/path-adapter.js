"use strict";

var Substance = require('./basics');
var oo = require('./oo');

/**
 * An adapter to access an object via path.
 */
function PathAdapter(obj) {
  if (obj) {
    this.root = obj;
  }
}

PathAdapter.Prototype = function() {

  this.getRoot = function() {
    return this.root || this;
  };

  this._resolve = function(path, create) {
    var lastIdx = path.length-1;
    var context = this.getRoot();
    for (var i = 0; i < lastIdx; i++) {
      var key = path[i];
      if (context[key] === undefined) {
        if (create) {
          context[key] = {};
        } else {
          return undefined;
        }
      }
      context = context[key];
    }
    return context;
  };

  this.get = function(path) {
    if (Substance.isString(path)) {
      return this[path];
    } else if (!path || path.length === 0) {
      return this.getRoot();
    } else {
      var key = path[path.length-1];
      return this._resolve(path)[key];
    }
  };

  this.set = function(path, value) {
    if (Substance.isString(path)) {
      this[path] = value;
    } else {
      var key = path[path.length-1];
      this._resolve(path, true)[key] = value;
    }
  };

  this.delete = function(path, strict) {
    if (Substance.isString(path)) {
      delete this[path];
    } else {
      var key = path[path.length-1];
      var obj = this._resolve(path);
      if (strict && !obj || !obj[key]) {
        throw new Error('Invalid path.');
      }
      delete obj[key];
    }
  };

  this.clean = function() {
    var root = this.getRoot();
    for (var key in root) {
      if (root.hasOwnProperty(key)) {
        delete root[key];
      }
    }
  };
};

oo.initClass( PathAdapter );

module.exports = PathAdapter;
