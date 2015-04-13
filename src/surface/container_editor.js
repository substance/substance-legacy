'use strict';

var Substance = require('../basics');
var Document = require('../document');
var FormEditor = require('./form_editor');
var Annotations = require('../document/annotation_updates');
var Selection = Document.Selection;

function ContainerEditor(containerName, doc) {
  FormEditor.call(this, doc);
  this.containerName = containerName;
}

ContainerEditor.Prototype = function() {

  this.isContainerEditor = function() {
    return true;
  };

  this.getContainerName = function() {
    return this.containerName;
  };

  this.break = function(selection, info) {
    // console.log("Breaking at %s", selection.toString());
    info = info || {};
    var tx = this.document.startTransaction({ seleciton: selection });
    tx.selection = selection;
    try {
      if (!this.selection.isCollapsed()) {
        this._delete(tx);
      }
      this._break(tx);
      tx.save({ selection: tx.selection }, info);
      this.selection = tx.selection;
    } finally {
      tx.cleanup();
    }
  };

  this.copyPropertySelection = function(selection) {
    var copy = this.document.newInstance();
    var path = selection.start.path;
    var offset = selection.start.offset;
    var endOffset = selection.end.offset;
    var text = this.document.get(path);
    var containerNode = copy.create({
      type: 'container',
      id: 'content',
      nodes: []
    });
    copy.create({
      type: 'text',
      id: 'text',
      content: text.substring(offset, endOffset)
    });
    containerNode.show('text');
    var annotations = this.document.getIndex('annotations').get(path, offset, endOffset);
    Substance.each(annotations, function(anno) {
      var data = Substance.deepclone(anno.toJSON());
      data.path = ['text', 'content'];
      data.range = [ Math.max(offset, anno.range[0])-offset, Math.min(endOffset, anno.range[1])-offset];
      copy.create(data);
    });
    return copy;
  };

  this.copyContainerSelection = function(selection) {
    var doc = this.document;
    var copy = this.document.newInstance();
    var annotationIndex = doc.getIndex('annotations');

    var container = this.container;
    var startComp = container.getComponent(selection.start.path);
    var endComp = container.getComponent(selection.end.path);
    var containerNode = copy.create({
      type: 'container',
      id: 'content',
      nodes: []
    });

    // 1. Copy nodes and annotations.
    var i, comp;
    var created = {};
    for (i = startComp.getIndex(); i <= endComp.getIndex(); i++) {
      comp = container.getComponentAt(i);
      var nodeId = comp.parentNode.id;
      var node = doc.get(nodeId);
      if (!created[nodeId]) {
        created[nodeId] = copy.create(node.toJSON());
        containerNode.show(nodeId);
      }
      var annotations = annotationIndex.get(comp.path);
      for (var j = 0; j < annotations.length; j++) {
        copy.create(Substance.clone(annotations[j].toJSON()));
      }
    }
    // 2. Truncate properties according to the selection.
    // TODO: we need a more sophisticated concept when we introduce dynamic structures
    // such as lists or tables
    var startNodeComponent = startComp.parentNode;
    var text;
    for (i = 0; i < startNodeComponent.components.length; i++) {
      comp = startNodeComponent.components[i];
      if (comp === startComp) {
        if (selection.start.offset > 0) {
          text = doc.get(comp.path);
          copy.update(comp.path, {
            delete: { start: 0, end: selection.start.offset }
          });
          Annotations.deletedText(copy, comp.path, 0, selection.start.offset);
        }
        break;
      } else {
        copy.set(comp.path, "");
      }
    }
    var endNodeComponent = endComp.parentNode;
    for (i = 0; i < endNodeComponent.components.length; i++) {
      comp = endNodeComponent.components[i];
      if (comp === endComp) {
        text = doc.get(comp.path);
        if (selection.end.offset < text.length) {
          copy.update(comp.path, {
            delete: { start: selection.end.offset, end: text.length }
          });
          Annotations.deletedText(copy, comp.path, selection.end.offset, text.length);
        }
        break;
      } else {
        copy.set(comp.path, "");
      }
    }
    return copy;
  };

  // create a document instance containing only the selected content
  this.copy = function(selection) {
    if (selection.isNull()) {
      return null;
    }
    // return a simplified version if only a piece of text is selected
    if (selection.isPropertySelection() || Substance.isEqual(selection.start.path, selection.end.path)) {
      return this.copyPropertySelection(selection);
    }
    else if (selection.isContainerSelection()) {
      return this.copyContainerSelection(selection);
    }
  };

  this.paste = function(selection, data) {
    if (selection.isNull()) {
      console.error("Can not paste, without selection.");
      return;
    }
    // plain text paste is simple
    if (!data.content) {
      return this.insertText(data.text, selection);
    }
    var pasteDoc = data.content;
    var tx = this.document.startTransaction({ selection: selection });
    tx.selection = selection;
    try {
      if (!selection.isCollapsed()) {
        this._delete(tx);
      }
      var nodes = pasteDoc.get('content').nodes;
      if (nodes.length > 0) {
        var first = pasteDoc.get(nodes[0]);
        if (nodes.length === 1 && first.type === "text") {
          this._pasteAnnotatedText(tx, pasteDoc);
        } else {
          this._pasteDocument(tx, pasteDoc);
        }
      }
      tx.save({selection: tx.selection});
      this.selection = tx.selection;
    } finally {
      tx.cleanup();
    }
  };

  this._pasteAnnotatedText = function(tx, copy) {
    var selection = tx.selection;
    var nodes = copy.get('content').nodes;
    var path = [nodes[0], 'content'];
    var text = copy.get(path);
    var annotations = copy.getIndex('annotations').get(path);
    var path = selection.start.path;
    var offset = selection.start.offset;
    // insert plain text
    tx.update(path, { insert: { offset: offset, value: text } } );
    Annotations.insertedText(tx, selection.start, text.length);
    // copy annotations
    Substance.each(annotations, function(anno) {
      var data = anno.toJSON();
      data.path = path.slice(0);
      data.range = data.range.slice(0);
      data.range[0] += offset;
      data.range[1] += offset;
      if (tx.get(data.id)) {
        data.id = Substance.uuid(data.type);
      }
      tx.create(data);
    });
  };

  this._pasteDocument = function(tx, doc) {
    var pasteDoc = doc;

    var containerNode = tx.get(this.containerName);

    // Break, unless we are at the last character of a node,
    // then we can simply insert after the node
    var startComp = this.container.getComponent(tx.selection.start.path);
    var startNodeComp = startComp.parentNode;
    var insertPos;
    if ( startComp === Substance.last(startNodeComp.components) &&
      tx.get(startComp.path).length === tx.selection.start.offset )
    {
      insertPos = containerNode.getPosition(tx.selection.start.path[0]) + 1;
    } else {
      this._break(tx);
      // _break() sets a new selection
      insertPos = containerNode.getPosition(tx.selection.start.path[0]);
    }
    if (insertPos < 0) {
      console.error('Could not find insertion position in ContainerNode.');
    }
    // transfer nodes from content document
    // TODO: transfer annotations
    var nodeIds = pasteDoc.get("content").nodes;
    var annoIndex = pasteDoc.getIndex('annotations');
    var insertedNodes = [];
    for (var i = 0; i < nodeIds.length; i++) {
      var nodeId = nodeIds[i];
      var node = pasteDoc.get(nodeId).toJSON();
      // create a new id if the node exists already
      if (tx.get(nodeId)) {
        node.id = Substance.uuid(node.type);
      }
      tx.create(node);
      containerNode.show(node.id, insertPos++);
      insertedNodes.push(node);

      // EXPERIMENTAL also transfer annotations
      // what about nodes that are referenced by annotations?
      // Solve this properly, and test driven
      var annos = annoIndex.get(nodeId);
      for (var j = 0; j < annos.length; j++) {
        var data = annos[j].toJSON();
        if (node.id !== nodeId) {
          data.path[0] = node.id;
        }
        if (tx.get(data.id)) {
          data.id = Substance.uuid(data.type);
        }
        tx.create(data);
      }
    }
  };

  this._break = function(tx) {
    var range = tx.selection.getRange();
    var component = this.container.getComponent(range.start.path);
    var node = tx.get(component.path[0]);
    switch (node.type) {
      case "paragraph":
      case "text":
      case "heading":
        this._breakTextNode(tx, node, range.start.offset);
    }
  };

  this._breakTextNode = function(tx, node, offset) {
    // split the text property and create a new paragraph node with trailing text and annotations transferred
    var text = node.content;
    var containerNode = tx.get(this.containerName);
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
    var containerNode = tx.get(this.containerName);
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

  this._mergeTable = {
    'text': {
      'text': this._mergeTextNodes
    }
  };

  this._merge = function(tx, path, dir) {
    var component = this.container.getComponent(path);
    var node = tx.get(component.path[0]);
    var otherNode, otherPath;
    if (dir === 'right' && component.next) {
      if (!this._mergeTable[node.type]) {
        return;
      }
      otherPath = component.next.path;
      otherNode = tx.get(otherPath[0]);
      if (this._mergeTable[node.type][otherNode.type]) {
        this._mergeTable[node.type][otherNode.type].call(this, tx, path, otherPath);
      }
    } else if (dir === 'left' && component.previous) {
      otherPath = component.previous.path;
      otherNode = tx.get(otherPath[0]);
      if (!this._mergeTable[otherNode.type]) {
        return;
      }
      if (this._mergeTable[otherNode.type][node.type]) {
        this._mergeTable[otherNode.type][node.type].call(this, tx, otherPath, path);
      }
    }
  };

};

Substance.inherit(ContainerEditor, FormEditor);

module.exports = ContainerEditor;