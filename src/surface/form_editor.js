'use strict';

var Substance = require('../basics');
var Document = Substance.Document;
var Annotations = require('../document/annotation_updates');

function FormEditor(node) {
  this.node = node;
  this.document = node.getDocument();
  this.selection = Document.nullSelection;
}

FormEditor.Prototype = function() {

  this.insertText = function(textInput, selectionBefore, selectionAfter, info) {
    console.log("Inserting text: '%s' at %s, after that: %s", textInput, selectionBefore.toString(), selectionAfter.toString());
    var tx = this.document.startTransaction();
    try {
      tx.selection = selectionBefore;
      if (!this.selection.isCollapsed()) {
        this._delete(tx);
      }
      var range = tx.selection.getRange();
      tx.update(range.start.path, { insert: { offset: range.start.offset, value: textInput } } );
      // TODO: not yet supported, but probably we will inject additional information such as selection here
      Annotations.insertedText(tx, range.start, textInput.length);
      tx.save({
        before: { selection: selectionBefore },
        after: { selection: selectionAfter }
      }, info);
    } finally {
      tx.cleanup();
    }
    this.selection = selectionAfter;
  };

  // implements backspace and delete
  this.delete = function(selection, direction, info) {
    var range = selection.getRange();
    var tx = this.document.startTransaction();
    tx.selection = selection;
    var startChar, endChar;
    try {
      // if collapsed see if we are at the start or the end
      // and try to merge
      if (selection.isCollapsed()) {
        var prop = this.document.get(range.start.path);
        if (range.start.offset === 0 && direction === 'left') {
          // TODO: try to merge into previous
          console.log("TODO: Implement delete with merge previous");
        } else if (range.start.offset === prop.length) {
          // TODO: try to merge next
          console.log("TODO: Implement delete with merge next");
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
      tx.save({
        before: { selection: selection },
        after: { selection: tx.selection }
      }, info);
    } finally {
      tx.cleanup();
    }
  };

  this._deleteSelected = function(tx) {
    if (!tx.selection.isPropertySelection()) {
      throw new Error('Not implented for ContainerSelection.');
    } else {
      this._deleteSelectedText(tx);
    }
  };

  this._deleteSelectedText = function(tx) {
    var sel = tx.selection;
    var range = sel.getRange();
    var path = range.start.path;
    tx.update(path, { delete: { start: range.start.offset, end: range.end.offset } });
    tx.selection = tx.selection.collapse('left');
  };

  // no merge, just move cursor
  this._mergeWith = function(tx, dir) {
    if (dir === 'previous') {
      // move cursor to end of previous component
    } else {
      // move cursor to beginning of next component
    }
  };

};

Substance.initClass(FormEditor);

module.exports = FormEditor;