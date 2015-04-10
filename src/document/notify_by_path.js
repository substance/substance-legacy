'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

var NotifyByPathProxy = function() {
  this.listeners = new PathAdapter();
};

NotifyByPathProxy.Prototype = function() {

  this.onDocumentChanged = function(change, info) {
    var listeners = this.listeners;
    change.traverse(function(path, ops) {
      var key = path.concat(['listeners']);
      var scopedListeners = listeners.get(key);
      Substance.each(scopedListeners, function(entry) {
        entry.method.call(entry.listener, change, info);
      });
    }, this);
  };

  this.add = function(path, listener, method) {
    var key = path.concat(['listeners']);
    var listeners = this.listeners.get(key);
    if (!listeners) {
      listeners = [];
      this.listeners.set(key, listeners);
    }
    if (!method) {
      throw new Error('Invalid argument: expected function but got ' + method);
    }
    listeners.push({ method: method, listener: listener });
  };

  // TODO: it would be cool if we would just need to provide the listener instance, no path
  this.remove = function(path, listener) {
    var key = path.concat(['listeners']);
    var listeners = this.listeners.get(key);
    if (listeners) {
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i].listener === listener) {
          listeners.splice(i, 1);
          return;
        }
      }
    }
  };
};

Substance.initClass(NotifyByPathProxy);

module.exports = NotifyByPathProxy;
