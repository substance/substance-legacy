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

  // Selects the current property.
  this.selectAll = function(state) {
    var sel = state.selection;
    if (sel.isNull()) return;
    if (sel.isPropertySelection()) {
      var path = sel.start.path;
      var text = this.document.get(path);
      state.selection = this.document.createSelection({
        type: 'property',
        path: path,
        startOffset: 0,
        endOffset: text.length
      });
    }
  };

  this.write = function(tx, args) {
    return Transformations.insertText(tx, args);
  };

  // implements backspace and delete
  this.delete = function(tx, args) {
    return Transformations.deleteSelection(tx, args);
  };

  // no breaking
  this.break = function(tx, args) {
    return this.softBreak(tx, args);
  };

  this.softBreak = function(tx, args) {
    args.text = "\n";
    return this.write(tx, args);
  };

  this.paste = function(tx, args) {
    var data = args.data;
    // TODO: for now only plain text is inserted
    // We could do some stitching however, preserving the annotations
    // received in the document
    if (data.text) {
      args.text = data.text;
      return this.write(tx, args);
    } else {
      return args;
    }
  };
};

Substance.initClass(FormEditor);

module.exports = FormEditor;
