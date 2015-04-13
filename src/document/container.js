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
    throw new Error('Contract: a container must have an id be able to associate container annotations.');
  }
  this.id = id;
  this.components = [];
  this.nodes = {};
  this.byPath = new PathAdapter({});
}

Container.Prototype = function() {

  this._setComponents = function(components) {
    var byPath = new PathAdapter({});
    var nodes = {};
    for (var i = 0; i < components.length; i++) {
      var comp = components[i];
      if (comp.path.length !== 2) {
        throw new Error("Contract: every property path must have 2 elements");
      }
      var nodeId = comp.path[0];
      var node = nodes[nodeId];
      if (!node) {
        node = new Container.Node(nodeId);
        nodes[nodeId] = node;
      }
      comp.parentNode = node;
      node.components.push(comp);
      if (i > 0) {
        components[i-1].next = comp;
        comp.previous = components[i-1];
      }
      byPath.set(comp.path, comp);
    }
    this.components = components;
    this.nodes = nodes;
    this.byPath = byPath;
  };

  this.getComponent = function(path) {
    var comp = this.byPath.get(path);
    return comp;
  };

  this.getComponentAt = function(idx) {
    return this.components[idx];
  };

  this.getAnnotationFragments = function(containerAnnotation) {
    var fragments = [];
    var doc = containerAnnotation.getDocument();
    var anno = containerAnnotation;
    var startAnchor = anno.getStartAnchor();
    var endAnchor = anno.getEndAnchor();
    // if start and end anchors are on the same property, then there is only one fragment
    if (Substance.isEqual(startAnchor.path, endAnchor.path)) {
      fragments.push({
        path: startAnchor.path,
        id: anno.id,
        range: [startAnchor.offset, endAnchor.offset],
      });
    }
    // otherwise create a trailing fragment for the property of the start anchor,
    // full-spanning fragments for inner properties,
    // and one for the property containing the end anchor.
    else {
      var text = doc.get(startAnchor.path);
      var startComp = this.getComponent(startAnchor.path);
      var endComp = this.getComponent(endAnchor.path);
      if (!startComp || !endComp) {
        throw new Error('Could not find components of ContainerAnnotation');
      }
      fragments.push({
        path: startAnchor.path,
        id: anno.id,
        range: [startAnchor.offset, text.length],
      });
      for (var idx = startComp.idx + 1; idx < endComp.idx; idx++) {
        var comp = this.getComponentAt(idx);
        text = doc.get(comp.path);
        fragments.push({
          path: comp.path,
          id: anno.id,
          range: [0, text.length],
        });
      }
      fragments.push({
        path: endAnchor.path,
        id: anno.id,
        range: [0, endAnchor.offset],
      });
    }
    return fragments;
  };

};

Substance.initClass(Container);

Container.Component = function Component(path, idx) {
  this.path = path;
  this.idx = idx;
  this.parentNode = null;
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

  this.getParentNode = function() {
    return this.parentNode;
  };
};

Substance.initClass(Container.Component);

Container.Node = function Node(id) {
  this.id = id;
  this.components = [];
};

Substance.initClass(Container.Node);

module.exports = Container;
