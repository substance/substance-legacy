'use strict';

var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var Document = require('../document');
var FormEditor = require('./form_editor');
var Annotations = Document.AnnotationUpdates;
var Transformations = Document.Transformations;

function ContainerEditor(containerId) {
  FormEditor.call(this);
  this.containerId = containerId;
}

ContainerEditor.Prototype = function() {

  this.isContainerEditor = function() {
    return true;
  };

  this.getContainerId = function() {
    return this.containerId;
  };

  /**
   * Performs a `deleteSelection` tr
   */
  this.delete = function(tx, args) {
    args.containerId = this.containerId;
    return Transformations.deleteSelection(tx, args);
  };

  this.break = function(tx, args) {
    args.containerId = this.containerId;
    return Transformations.breakNode(tx, args);
  };

  this.insertNode = function(tx, args) {
    args.containerId = this.containerId;
    return Transformations.insertNode(tx, args);
  };

  this.switchType = function(tx, args) {
    args.containerId = this.containerId;
    return Transformations.switchTextType(tx, args);
  };

  this.selectAll = function(doc) {
    var container = doc.get(this.containerId);
    var first = container.getFirstComponent();
    var last = container.getLastComponent();
    var lastText = doc.get(last.path);
    return doc.createSelection({
      type: 'container',
      containerId: this.containerId,
      startPath: first.path,
      startOffset: 0,
      endPath: last.path,
      endOffset: lastText.length
    });
  };

  this.paste = function(tx, args) {
    args.containerId = this.containerId;
    return Transformations.paste(tx, args);
  };

};

OO.inherit(ContainerEditor, FormEditor);

module.exports = ContainerEditor;
