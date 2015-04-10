'use strict';

var Substance = require('../basics');
var Operator = require('../operator');
var ObjectOperation = Operator.ObjectOperation;
var PathAdapter = Substance.PathAdapter;

// TODO: let others register to this event proxy
// either via a path or for any event
// When registering by path an event is sent to all observers registered
// for paths spanned by an annotation
var ContainerAnnotationEvents = function(doc, container) {
  this.doc = doc;
  this.container = container;
  this.listeners = new PathAdapter.Arrays();
  doc.connect(this, { 'document:changed': this.onDocumentChanged });
};

ContainerAnnotationEvents.Prototype = function() {

  this.detach = function() {
    this.doc.disconnect(this);
    this.doc = null;
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

  this.onDocumentChanged = function(change, ops, info) {
    var updates = [];
    var doc = this.doc;
    var schema = doc.getSchema();
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      switch (op.type) {
      case ObjectOperation.CREATE:
      case ObjectOperation.DELETE:
        if (schema.isInstanceOf(op.val.type, 'container_annotation')) {
          updates.push(op.val);
        }
        break;
      case ObjectOperation.SET:
      case ObjectOperation.UPDATE:
        var anno = doc.get(op.path[0]);
        if (anno.isInstanceOf('container_annotation')) {
          updates.push(anno);
        }
        break;
      }
    }
    if (updates.length === 0) return;

    this.notifyListeners(updates, info);
  };

  this.notifyListeners = function(updates, change, ops, info) {
    for (var i = 0; i < updates.length; i++) {
      var data = updates[i];
      var startComp = this.container.getComponent(data.startPath);
      var endComp = this.container.getComponent(data.endPath);
      var startIdx = startComp.getIndex();
      var endIdx = endComp.getIndex();
      for (var j = startIdx; j <= endIdx; j++) {
        var comp = this.container.getComponentAt(j);
        var l = this.listeners.get(comp.path);
        for (var k = 0; k < l.length; k++) {
          l[k].fn.call(l[k].ctx, change, ops, info);
        }
      }
    }
    Substance.each(this.listeners.get('any'), function(l) {
      l.fn.call(l.ctx);
    });
  };

};

Substance.initClass(ContainerAnnotationEvents);

module.exports = ContainerAnnotationEvents;
