'use strict';

var Substance = require('../basics');
var Document = require('../document');
var FormEditor = require('./form_editor');
var Annotations = require('../document/annotation_updates');
var Selection = Document.Selection;

function FullfledgedEditor(doc) {
  FormEditor.call(this, doc);
}

FullfledgedEditor.Prototype = function() {

  this.break = function(selection, info) {
    console.log("Breaking at %s", selection.toString());
    info = info || {};
    var tx = this.document.startTransaction();
    tx.selection = selection;
    try {
      if (!this.selection.isCollapsed()) {
        this._delete(tx);
      }
      var range = tx.selection.getRange();
      var component = this.container.getComponent(range.start.path);
      var node = tx.get(component.path[0]);
      switch (node.type) {
        case "paragraph":
        case "text":
        case "heading":
          this._breakTextNode(tx, node, range.start.offset);
      }
      tx.save({
        before: { selection: selection },
        after: { selection: tx.selection }
      }, info);
      this.selection = tx.selection;
    } finally {
      tx.cleanup();
    }
  };

  this._breakTextNode = function(tx, node, offset) {
    // split the text property and create a new paragraph node with trailing text and annotations transferred
    var text = node.content;
    var containerNode = tx.get(this.container.name);
    var path = [node.id, 'content'];
    var nodePos = containerNode.getPosition(node.id);
    var id = Substance.uuid('text_');
    var newPath = [id, 'content'];
    // 1. create a new node
    tx.create({
      id: id,
      type: 'text',
      content: text.substring(offset)
    });
    // 2. transfer annotations which are after offset to the new node
    Annotations.transferAnnotations(tx, path, offset, [id, 'content'], 0);
    // 3. truncate the original property
    tx.update(path, {
      delete: { start: offset, end: text.length }
    });
    // 4. show the new node
    containerNode.show(id, nodePos+1);
    // 5. update the selection
    tx.selection = Selection.create(newPath, 0);
  };

  this._merge = function(tx, dir) {
    if (dir === 'previous') {
      // move cursor to end of previous component
    } else {
      // move cursor to beginning of next component
    }
  };

};

Substance.inherit(FullfledgedEditor, FormEditor);

module.exports = FullfledgedEditor;