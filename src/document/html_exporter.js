"use strict";

var Substance = require('../basics');
var Annotator = require('./annotator');

function HtmlExporter(config) {
  this.config = config || {};
  this.state = null;

  this.$ = window.$;
}

HtmlExporter.Prototype = function() {

  this.createElement = function(tagName) {
    return window.document.createElement(tagName);
  };

  this.toHtml = function(doc, containerId, options) {
    options = {} || options;
    this.state =  {
      doc: doc,
      rootElement: window.document.createElement('div'),
      options: options
    };
    var container = doc.get(containerId);
    this.container(container);
    return this.state.rootElement;
  };

  this.propertyToHtml = function(doc, path, options) {
    options = {} || options;
    this.state =  {
      doc: doc,
      options: options
    };
    var frag = this.annotatedText(path);
    var div = window.document.createElement('div');
    div.appendChild(frag);
    var html = div.innerHTML;
    // console.log('HtmlExporter.propertyToHtml', path, html);
    return html;
  };

  this.container = function(containerNode) {
    var state = this.state;
    var nodeIds = containerNode.nodes;
    for (var i = 0; i < nodeIds.length; i++) {
      var node = state.doc.get(nodeIds[i]);
      var el = node.toHtml(this);
      if (!el || (el.nodeType !== window.Node.ELEMENT_NODE)) {
        throw new Error('Contract: Node.toHtml() must return a DOM element. NodeType: '+node.type);
      }
      el.dataset.id = node.id;
      state.rootElement.appendChild(el);
    }
  };

  this.annotatedText = function(path) {
    var self = this;
    var doc = this.state.doc;
    var fragment = window.document.createDocumentFragment();
    var annotations = doc.getIndex('annotations').get(path);
    var text = doc.get(path);

    var annotator = new Annotator();
    annotator.onText = function(context, text) {
      context.children.push(window.document.createTextNode(text));
    };
    annotator.onEnter = function(entry) {
      var anno = entry.node;
      return {
        annotation: anno,
        children: []
      };
    };
    annotator.onExit = function(entry, context, parentContext) {
      var anno = context.annotation;
      var el = anno.toHtml(self, context.children);
      if (!el || el.nodeType !== window.Node.ELEMENT_NODE) {
        throw new Error('Contract: Annotation.toHtml() must return a DOM element.');
      }
      el.dataset.id = anno.id;
      parentContext.children.push(el);
    };
    var root = { children: [] };
    annotator.start(root, text, annotations);
    for (var i = 0; i < root.children.length; i++) {
      fragment.appendChild(root.children[i]);
    }
    return fragment;
  };

};

Substance.initClass(HtmlExporter);

module.exports = HtmlExporter;
