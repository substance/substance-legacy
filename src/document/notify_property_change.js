'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

var NotifyByPathProxy = function(doc) {
  this.listeners = new PathAdapter();
  this.doc = doc;
};

NotifyByPathProxy.Prototype = function() {

  this.onDocumentChanged = function(change, info) {
    var listeners = this.listeners;
    var updated = change.updated;
    Substance.each(change.ops, function(op) {
      if ( (op.type === "create" || op.type === "delete") && (op.val.path || op.val.startPath)) {
        if (op.val.path) {
          updated.set(op.val.path, true);
        } else if (op.val.startPath) {
          updated.set(op.val.startPath, true);
          updated.set(op.val.endPath, true);
        }
      }
      else if (op.type === "set" && (op.path[1] === "path" || op.path[1] === "startPath" || op.path[1] === "endPath")) {
        updated.set(op.val, true);
        updated.set(op.original, true);
      }
      else if (op.type === "set" && (op.path[1] === "startOffset" || op.path[1] === "endOffset")) {
        var anno = this.doc.get(op.path[0]);
        if (anno) {
          if (anno.path) {
            updated.set(anno.path, true);
          } else {
            updated.set(anno.startPath, true);
            updated.set(anno.endPath, true);
          }
        }
      }
    }, this);
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
