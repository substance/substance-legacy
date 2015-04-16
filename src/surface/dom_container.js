'use strict';

var Substance = require('../basics');
var Document = require('../document');
var Container = Document.Container;

// DomContainer
// ------------
//
// A Container implementation that extracts the structure information
// from a rendered DOM node.
//
// In an earlier version of Substance we had a Container
// which required the implementation of so called NodeSurfaces which
// expressed the node's layout. This made the implementation of nodes
// more complex.
//
// Using this as approach has the drawback that container related
// things, such as ContainerAnnotations and ContainerEditors can not
// be used without a rendered view, and this Container must be
// updated whenever the view is rerendered.
//
function DomContainer(containerId, element) {
  Container.call(this, containerId);
  this.element = element;
  this.reset();
}

DomContainer.Prototype = function() {
  this.reset = function() {
    var $componentElements = DomContainer.getEditableElements(this.element);
    // console.log('DomContainer: found %s editable components.', $componentElements.length);
    var components = Substance.map($componentElements, function(el, idx) {
      return new DomContainer.Component(el, idx);
    });
    this._setComponents(components);
  };
};

Substance.inherit(DomContainer, Container);

DomContainer.Component = function(element, idx, parentNode) {
  Container.Component.call(this, DomContainer.getPathFromElement(element), idx);
  this.parentNode = parentNode;
  this.element = element;
};

Substance.inherit(DomContainer.Component, Container.Component);

DomContainer.getPathFromElement = function(element) {
  return element.dataset.path.split('.');
};

DomContainer.getEditableElements = function(element) {
  return $(element).find('*[data-path]');
};

module.exports = DomContainer;
