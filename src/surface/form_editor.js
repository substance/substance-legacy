'use strict';

var Substance = require('../basics');
var Document = Substance.Document;
var Selection = Document.Selection;
var Annotations = require('../document/annotation_updates');

function FormEditor(doc) {
  this.document = doc;
  this.selection = Document.nullSelection;
  // TODO: find better name. It used in container aware editors (which need the layout of components).
  this.container = null;
}

FormEditor.Prototype = function() {

  this.isContainerEditor = function() {
    return false;
  };

  this.getContainer = function() {
    return this.container;
  };

  this.setContainer = function(container) {
    this.container = container;
  };

  this.getDocument = function() {
    return this.document;
  };

  this.insertText = function(textInput, selection, info) {
    console.log("Inserting text: '%s' at %s", textInput, selection.toString());
    var tx = this.document.startTransaction({ selection: selection });
    tx.selection = selection;
    try {
      if (!this.selection.isCollapsed()) {
        this._delete(tx, 'right');
      }
      var range = tx.selection.getRange();
      tx.update(range.start.path, { insert: { offset: range.start.offset, value: textInput } } );
      Annotations.insertedText(tx, range.start, textInput.length);
      tx.selection = Selection.create(range.start.path, range.start.offset + textInput.length);
      tx.save({ selection: tx.selection }, info);
      this.selection = tx.selection;
    } finally {
      tx.cleanup();
    }
  };

  // implements backspace and delete
  this.delete = function(selection, direction, info) {
    var tx = this.document.startTransaction({ selection: selection });
    tx.selection = selection;
    try {
      this._delete(tx, direction);
      tx.save({ selection: tx.selection }, info);
      this.selection = tx.selection;
    } finally {
      tx.cleanup();
    }
  };

  this._delete = function(tx, direction) {
    var selection = tx.selection;
    var range = selection.getRange();
    var startChar, endChar;
    // if collapsed see if we are at the start or the end
    // and try to merge
    if (selection.isCollapsed()) {
      var prop = this.document.get(range.start.path);
      if ((range.start.offset === 0 && direction === 'left') ||
          (range.start.offset === prop.length && direction === 'right')) {
        this._merge(tx, range.start.path, direction);
      } else {
        // simple delete one character
        startChar = (direction === 'left') ? range.start.offset-1 : range.start.offset;
        endChar = startChar+1;
        tx.update(range.start.path, {
          delete: { start: startChar, end: endChar }
        });
        Annotations.deletedText(tx, range.start.path, startChar, endChar);
        tx.selection = Document.Selection.create(range.start.path, startChar);
      }
    } else if (selection.isPropertySelection()) {
      // if a property selection but not collapsed
      // simply delete the selected area
      startChar = range.start.offset;
      endChar = range.end.offset;
      tx.update(range.start.path, {
        delete: { start: startChar, end: endChar }
      });
      Annotations.deletedText(tx, range.start.path, startChar, endChar);
      tx.selection = Document.Selection.create(range.start);
    } else {
      // deal with container deletes
      console.log("TODO: Implement delete for ContainerSelection");
    }
  };

  // no breaking
  this.break = function(selection) {
    this.selection = selection;
  };

  // no merging, just move cursor when pressing backspace
  this._merge = function(tx, path, dir) {
    var component = this.container.getComponent(path);
    if (dir === 'left') {
      // move cursor to end of previous component
      if (component.previous) {
        var content = tx.get(component.previous.path);
        tx.selection = Selection.create(component.previous.path, content.length);
      }
    }
  };

};

Substance.initClass(FormEditor);

module.exports = FormEditor;