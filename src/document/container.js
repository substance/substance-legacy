'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

function Container() {
  this.components = [];
  this.byPath = new PathAdapter({});
}

Container.Prototype = function() {

  this._setComponents = function(components) {
    var byPath = new PathAdapter({});
    for (var i = 0; i < components.length; i++) {
      var comp = components[i];
      if (i > 0) {
        components[i-1].next = comp;
        comp.previous = components[i-1];
      }
      byPath.set(comp.path, comp);
    }
    this.components = components;
    this.byPath = byPath;
  };

  this.getComponent = function(path) {
    var comp = this.byPath.get(path);
    if (!comp) {
      throw new Error('No component found for path ' + JSON.stringify(path));
    }
    return comp;
  };

  this.getComponentAt = function(idx) {
    return this.components[idx];
  };

};

Substance.initClass(Container);

Container.Component = function Component(path, idx) {
  this.path = path;
  this.idx = idx;
  this.previous = null;
  this.next = null;
};

Container.Component.Prototype = function() {

  this.hasPrevious = function() {
    return !!this.previous;
  };

  this.getPrevious = function() {
    return this.previous;
  };

  this.hasNext = function() {
    return !!this.next;
  };

  this.getNext = function() {
    return this.next;
  };

  this.getIndex = function() {
    return this.idx;
  };

};

Substance.initClass(Container.Component);

module.exports = Container;
