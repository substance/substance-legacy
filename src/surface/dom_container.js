'use strict';

var Substance = require('../basics');
var Document = require('../document');
var Container = Document.Container;

// A simple as possible implementation of a container working on a rendered container.
// This implementation takes just the root element and analyzes the structure on demand and locally.
// The container interface is used to get knowledge about the structure to do container-wide editing, such as break or merge of nodes
function DomContainer(element) {
  Container.call(this);
  this.element = element;
  this.reset();
}

DomContainer.Prototype = function() {

  this.reset = function() {
    var $componentElements = DomContainer.getEditableElements(this.element);
    var components = Substance.map($componentElements, function(el, idx) {
      return new DomContainer.Component(el, idx);
    });
    this._setComponents(components);
  };

};

Substance.inherit(DomContainer, Container);

DomContainer.Component = function(element, idx) {
  Container.Component.call(this, DomContainer.getPathFromElement(element), idx);
  this.element = element;
};

Substance.inherit(DomContainer.Component, Container.Component);

DomContainer.getPathFromElement = function(element) {
  return element.dataset.path.split('.');
};

DomContainer.getEditableElements = function(element) {
  return $(element).find('*[data-path][contenteditable=true]');
};

module.exports = DomContainer;
