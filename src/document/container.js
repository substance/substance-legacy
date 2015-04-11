'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

// Container
// --------
//
// Holds a sequence of document nodes (see ContainerNode). Well not really. 
// since each node can consist of multiple components (e.g. a figure has a
// title and a caption) they need to be flattened to a list of components. 
// This flat structure is modelled by this class.


function Container(id) {
  if (!id) {
    throw new Error('Contract: a container must have an id be able to associate container annotations.')
  }
  this.id = id;
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
