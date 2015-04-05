'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

// A simple as possible implementation of a container working on a rendered container.
// This implementation takes just the root element and analyzes the structure on demand and locally.
// The container interface is used to get knowledge about the structure to do container-wide editing, such as break or merge of nodes
function DomContainer(element) {
  this.element = element;
  this.$element = $(element);
  this.name = this.$element.attr('data-id');

  this.$componentElements = null;
  this.components = null;
  this.byPath = null;

  this.reset();
}

DomContainer.Prototype = function() {

  this.reset = function() {
    var $componentElements = this.$element.find('*[data-path][contenteditable=true]');
    var components = [];
    var byPath = new PathAdapter({});
    for (var i = 0; i < $componentElements.length; i++) {
      var comp = new DomContainer.Component($componentElements[i], i);
      components.push(comp);
      if (i > 0) {
        components[i-1].next = comp;
        comp.previous = components[i-1];
      }
      byPath.set(comp.path, comp);
    }
    this.$componentElements = $componentElements;
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

};

Substance.initClass(DomContainer);

DomContainer.Component = function ComponentElement(element, idx) {
  this.element = element;
  this.path = element.dataset.path.split('.');
  this.idx = idx;
  this.previous = null;
  this.next = null;
};

DomContainer.Component.Prototype = function() {

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

};

Substance.initClass(DomContainer.Component);

module.exports = DomContainer;
