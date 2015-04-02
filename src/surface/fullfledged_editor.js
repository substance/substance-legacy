'use strict';

var Substance = require('../basics');
var Document = require('../document');

function FullfledgedEditor(containerNode) {

  this.containerNode = containerNode;
  this.document = containerNode.getDocument();
  this.selection = Document.NullSelection;

  this.tx = null;

}

FullfledgedEditor.Prototype = function() {

  this.insertText = function(textInput, selectionAfter) {
    console.log("Inserting text: '%s'", textInput);

    var selectionBefore = this.selection;
    var tx = this.document.startTransaction();
    try {
      tx.selection = this.selection;

      if (!this.selection.isCollapsed()) {
        this._delete(tx);
      }

      var range = tx.selection.getRange();
      tx.update(range.start.path, { insert: { offset: range.start.offset, value: textInput } } );

      // TODO: not yet supported, but probably we will inject additional information such as selection here
      tx.save({
        before: { selection: selectionBefore },
        after: { selection: selectionAfter }
      });
    } finally {
      tx.finish();
    }
  };

  this._delete = function(tx) {
    if (!this.selection.isPropertySelection(tx)) {
      throw new Error('Not implented for ContainerSelection.');
    } else {
      this._propertyDelete(tx);
    }
  };

  this._propertyDelete = function(tx) {
    var sel = tx.selection;
    var range = sel.getRange();
    var path = range.start.path;
    tx.update(path, { delete: { start: range.start.offset, end: range.end.offset } });
    tx.selection = tx.selection.collapse('left');
  };

};

Substance.initClass(FullfledgedEditor);

module.exports = FullfledgedEditor;