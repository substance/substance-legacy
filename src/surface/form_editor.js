'use strict';

var Substance = require('../basics');
var Document = require('../document');
var Selection = Document.Selection;
var Annotations = Document.AnnotationUpdates;
var Transformations = Document.Transformations;

function FormEditor(doc) {
  this.document = doc;
}

FormEditor.Prototype = function() {

  this.isContainerEditor = function() {
    return false;
  };

  this.getContainer = function() {
    return null;
  };

  this.setContainer = function() {};

  this.getDocument = function() {
    return this.document;
  };

  this.insertText = function(textInput, state, info) {
    this.document.transaction(state, info, function(tx, state) {
      Transformations.insertText(tx, {text: textInput}, state);
    });
  };

  // implements backspace and delete
  this.delete = function(direction, state, info) {
    this.document.transaction(state, info, function(tx, state) {
      Transformations.deleteSelection(tx, {direction: direction}, state);
    });
  };

  // Selects the current property.
  this.selectAll = function(state) {
    var sel = state.selection;
    if (sel.isNull()) return;
    if (sel.isPropertySelection()) {
      var path = sel.start.path;
      var text = this.document.get(path);
      state.selection = Selection.create(path, 0, text.length);
    }
  };

  // no breaking
  this.break = function(state) {
  };

  this.softBreak = function(state, info) {
    this.insertText('\n', state, info);
  };

  this.paste = function(data, state) {
    // TODO: for now only plain text is inserted
    // We could do some stitching however, preserving the annotations
    // received in the document
    if (data.text) {
      this.insertText(data.text, state);
    }
  };
};

Substance.initClass(FormEditor);

module.exports = FormEditor;
