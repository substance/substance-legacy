'use strict';

var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var PathAdapter = require('../basics/path_adapter');

var NotifyByPathProxy = function(doc) {
  this.listeners = new PathAdapter();
  this._list = [];
  this.doc = doc;
};

NotifyByPathProxy.Prototype = function() {

  this.onDocumentChanged = function(change, info) {
    var listeners = this.listeners;
    var updated = change.updated;

    function _updated(path) {
      if (!change.deleted[path[0]]) {
        updated.set(path, true);
      }
    }

    _.each(change.ops, function(op) {
      if ( (op.type === "create" || op.type === "delete") && (op.val.path || op.val.startPath)) {
        if (op.val.path) {
          _updated(op.val.path);
        } else if (op.val.startPath) {
          _updated(op.val.startPath);
          _updated(op.val.endPath);
        }
      }
      else if (op.type === "set" && (op.path[1] === "path" || op.path[1] === "startPath" || op.path[1] === "endPath")) {
        _updated(op.val);
        _updated(op.original);
      }
      else if (op.type === "set" && (op.path[1] === "startOffset" || op.path[1] === "endOffset")) {
        var anno = this.doc.get(op.path[0]);
        if (anno) {
          if (anno.path) {
            _updated(anno.path);
          } else {
            _updated(anno.startPath);
            _updated(anno.endPath);
          }
        }
      }
    }, this);
    change.traverse(function(path) {
      var key = path.concat(['listeners']);
      var scopedListeners = listeners.get(key);
      _.each(scopedListeners, function(entry) {
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

  this.connect = function(listener, path, method) {
    this.add(path, listener, method);
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

  this.disconnect = function(listener) {
    this.listeners.traverse(function(path, listeners) {
      _.deleteFromArray(listeners, listener);
    });
  };

};

OO.initClass(NotifyByPathProxy);

module.exports = NotifyByPathProxy;
