"use strict";

var Substance = require('../basics');
var Annotator = require('./annotator');

function HtmlExporter(config) {
  this.config = config || {};
}

HtmlExporter.Prototype = function() {

  this.toHtml = function(document, options) {
    options = {} || options;
    var containers = options.containers || ['content'];

    var state =  {
      document: document,
      options: options,
      output: []
    };

    for (var i = 0; i < containers.length; i++) {
      var container = document.get(containers[i]);
      this.container(state, container);
    }
    return state.output.join('');
  };

  this.container = function(state, containerNode) {
    var nodeIds = containerNode.nodes;
    for (var i = 0; i < nodeIds.length; i++) {
      var node = state.document.get(nodeIds[i]);
      switch(node.type) {
        case "heading":
          return this.heading(state, node);
        case "text":
          return this.text(state, node);
        default:
          console.error('Not yet implemented: ', node.type, node);
      }
    }
  };

  this.heading = function(state, node) {
    var tag = 'h' + node.level;
    state.output.push('<'+tag+'>');
    this.annotatedText(state, [node.id, 'content']);
    state.output.push('</'+tag+'>');
  };

  this.text = function(state, node) {
    state.output.push('<p>');
    this.annotatedText(state, [node.id, 'content']);
    state.output.push('</p>');
  };

  this.annotatedText = function(state, path) {
    var doc = state.document;
    var text = doc.get(path);

    var annotations = doc.getIndex('annotations').get(path);

    // this splits the text and annotations into smaller pieces
    // which is necessary to generate proper HTML.
    var annotator = new Annotator();
    var stack = [];

    annotator.onText = function(context, text) {
      state.output.push(text);
    };

    annotator.onEnter = function(entry) {
      var anno = doc.get(entry.id);
      switch (anno.type) {
        case 'strong':
          state.output.push('<b>');
          break;
        case 'emphasis':
          state.output.push('<i>');
          break;
        case 'entity_reference':
          state.output.push('<span class="'+ anno.type + '" data-target="'+ anno.target +'">');
          break;
        case 'subject_reference':
          state.output.push('<span class="'+ anno.type + '" data-target="'+ anno.target.join(',') +'">');
          break;
        default:
          state.output.push('<span class="'+anno.type);
          console.error('Not yet supported:', anno.type, anno);
      }
      stack.push(anno);
      return anno;
    };

    annotator.onExit = function() {
      var anno = stack.pop();
      switch (anno.type) {
        case 'strong':
          state.output.push('</b>');
          break;
        case 'emphasis':
          break;
        default:
          console.error('Not yet supported:', anno.type, anno);
      }
    };

    // this calls onText and onEnter in turns...
    annotator.start(null, text, annotations);
  };

};

Substance.initClass(HtmlExporter);

module.exports = HtmlExporter;
