'use strict';

var Substance = require('../basics');
var Operator = require('../operator');
var ObjectOperation = Operator.ObjectOperation;
var PathAdapter = Substance.PathAdapter;

// TODO: let others register to this event proxy
// either via a path or for any event
// When registering by path an event is sent to all observers registered
// for paths spanned by an annotation
var ContainerAnnotationEvents = function(doc) {
  this.doc = doc;
  this.container = null;
  this.listeners = new PathAdapter.Arrays();
};

ContainerAnnotationEvents.Prototype = function() {

  this.attach = function() {
    this.doc.connect(this, { 'document:changed': this.onDocumentChanged });
  }

  this.detach = function() {
    this.doc.disconnect(this);
  };

  this.setContainer = function(container) {
    this.container = container;
  };

  this.add = function(path, ctx, fn) {
    this.listeners.add(path, { ctx: ctx, fn: fn});
  };

  this.remove = function(path, ctx) {
    var listeners = this.listeners.get(path);
    for (var i = 0; i < listeners.length; i++) {
      if (listeners[i].ctx === ctx) {
        listeners.splice(i, 1);
        i--;
      }
    }
  };

  this.onDocumentChanged = function(change, info) {
    if (!this.container) return;
    var updates = [];
    var doc = this.doc;
    var schema = doc.getSchema();
    for (var i = 0; i < change.ops.length; i++) {
      var op = change.ops[i];
      switch (op.type) {
      case ObjectOperation.CREATE:
      case ObjectOperation.DELETE:
        if (schema.isInstanceOf(op.val.type, 'container_annotation')) {
          updates.push(op.val);
        }
        break;
      case ObjectOperation.SET:
        var anno = doc.get(op.path[0]);
        if (anno.isInstanceOf('container_annotation')) {
          var update = {
            startPath: anno.startPath,
            endPath: anno.endPath
          }
          if (op.path[1] === 'startPath') {
            update.oldStartPath = op.original;
          } else if (op.path[1] === 'endPath') {
            update.oldEndPath = op.original;
          }
          updates.push(update);
        }
        break;
      }
    }
    if (updates.length === 0) return;

    this.notifyListeners(updates, change, info);
  };

  this.notifyListeners = function(updates, change, info) {
    var uniq = new PathAdapter();
    for (var i = 0; i < updates.length; i++) {
      var data = updates[i];
      var startComp = this.container.getComponent(data.startPath);
      var endComp = this.container.getComponent(data.endPath);
      if (!startComp || !endComp) {
        console.warn("Could not lookup components for", data);
        continue;
      }
      var startIdx = startComp.getIndex();
      var endIdx = endComp.getIndex();
      if (data.oldStartPath) {
        startComp = this.container.getComponent(data.oldStartPath);
        startIdx = Math.min(startIdx, startComp.getIndex());
      }
      if (data.oldEndPath) {
        endComp = this.container.getComponent(data.oldEndPath);
        endIdx = Math.max(endIdx, endComp.getIndex());
      }
      for (var j = startIdx; j <= endIdx; j++) {
        var comp = this.container.getComponentAt(j);
        uniq.set(comp.path, true);
      }
    }
    var listeners = this.listeners;
    uniq.traverse(function(path, entry) {
      if (entry !== true) return;
      var l = listeners.get(path);
      for (var i = 0; i < l.length; i++) {
        // console.log('### Notifying listener for path', path, l[i].ctx);
        l[i].fn.call(l[i].ctx, change, info);
      }
    });
    Substance.each(listeners.get(['any']), function(l) {
      // console.log('### Notifying "any" listeners');
      l.fn.call(l.ctx);
    });
  };

};

Substance.initClass(ContainerAnnotationEvents);

module.exports = ContainerAnnotationEvents;
