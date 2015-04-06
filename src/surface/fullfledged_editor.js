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
        selectionBefore: selection,
        selectionAfter: tx.selection
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
    if (offset < text.length) {
      // 2. transfer annotations which are after offset to the new node
      Annotations.transferAnnotations(tx, path, offset, [id, 'content'], 0);
      // 3. truncate the original property
      tx.update(path, {
        delete: { start: offset, end: text.length }
      });
    }
    // 4. show the new node
    containerNode.show(id, nodePos+1);
    // 5. update the selection
    tx.selection = Selection.create(newPath, 0);
  };

  this._mergeTextNodes = function(tx, firstPath, secondPath) {
    var firstText = tx.get(firstPath);
    var firstLength = firstText.length;
    var secondText = tx.get(secondPath);
    var containerNode = tx.get(this.container.name);
    // 1. Append the second text
    tx.update(firstPath, { insert: { offset: firstLength, value: secondText } });
    // 2. Transfer annotations
    Annotations.transferAnnotations(tx, secondPath, 0, firstPath, firstLength);
    // 3. Hide the second node
    containerNode.hide(secondPath[0]);
    // 4. Delete the second node
    tx.delete(secondPath[0]);
    // 5. set the selection to the end of the first component
    tx.selection = Selection.create(firstPath, firstLength);
  };

  var _merge = {
    'text': {
      'text': this._mergeTextNodes
    }
  };

  this._merge = function(tx, path, dir) {
    var component = this.container.getComponent(path);
    var node = tx.get(component.path[0]);
    var otherNode, otherPath;
    if (dir === 'right' && component.next) {
      if (!_merge[node.type]) {
        return;
      }
      otherPath = component.next.path;
      otherNode = tx.get(otherPath[0]);
      if (_merge[node.type][otherNode.type]) {
        _merge[node.type][otherNode.type].call(this, tx, path, otherPath);
      }
    } else if (dir === 'left' && component.previous) {
      otherPath = component.previous.path;
      otherNode = tx.get(otherPath[0]);
      if (!_merge[otherNode.type]) {
        return;
      }
      if (_merge[otherNode.type][node.type]) {
        _merge[otherNode.type][node.type].call(this, tx, otherPath, path);
      }
    }
  };

};

Substance.inherit(FullfledgedEditor, FormEditor);

module.exports = FullfledgedEditor;