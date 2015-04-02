'use strict';

var Substance = require('substance');

function Registry() {
  this.entries = {};
  // used to control order
  this.names = [];
}

Registry.Prototype = function() {

  this.contains = function(name) {
    return !!this.entries[name];
  };

  this.add = function(name, data) {
    if (this.contains(name)) {
      this.remove(name);
    }
    this.entries[name] = data;
    this.names.push(name);
  };

  this.remove = function(name) {
    var pos = this.names.indexOf(name);
    if (pos >= 0) {
      this.names.splice(pos, 1);
    }
    delete this.entries[name];
  };

  this.get = function(name) {
    return this.entries[name];
  };

  this.each = function(fn, ctx) {
    for (var i = 0; i < this.names.length; i++) {
      var name = this.names[i];
      var _continue = fn.call(ctx, this.entries[name], name);
      if (_continue === false) {
        break;
      }
    }
  };
};

Substance.initClass(Registry);

module.exports = Registry;
