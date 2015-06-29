'use strict';

var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var Document = require('../document');
var FormEditor = require('./form_editor');
var Annotations = Document.AnnotationUpdates;
var Transformations = Document.Transformations;

function ContainerEditor(container) {
  FormEditor.call(this, container.getDocument());
  this.container = container;
}

ContainerEditor.Prototype = function() {

  // TODO: we should make paragraph the default type
  // as this seems to be a more natural choice
  this.defaultTextType = 'paragraph';

  this.isContainerEditor = function() {
    return true;
  };

  this.getContainer = function() {
    return this.container;
  };

  this.getContainerName = function() {
    return this.container.id;
  };

  /**
   * Performs a `deleteSelection` tr
   */
  this.delete = function(tx, args) {
    args.containerId = this.container.id;
    return Transformations.deleteSelection(tx, args);
  };

  this.break = function(tx, args) {
    args.containerId = this.container.id;
    return Transformations.breakNode(tx, args);
  };

  this.insertNode = function(tx, args) {
    args.containerId = this.container.id;
    return Transformations.insertNode(tx, args);
  };

  this.switchType = function(tx, args) {
    args.containerId = this.container.id;
    return Transformations.switchTextType(tx, args);
  };

  this.selectAll = function() {
    var container = this.container;
    var first = container.getFirstComponent();
    var last = container.getLastComponent();
    var lastText = this.document.get(last.path);
    return this.document.createSelection({
      type: 'container',
      containerId: this.container.id,
      startPath: first.path,
      startOffset: 0,
      endPath: last.path,
      endOffset: lastText.length
    });
  };

  // create a document instance containing only the selected content
  this.copy = function(selection) {
    if (selection.isNull()) {
      return null;
    }
    // return a simplified version if only a piece of text is selected
    if (selection.isPropertySelection() || _.isEqual(selection.start.path, selection.end.path)) {
      return this._copyPropertySelection(selection);
    }
    else if (selection.isContainerSelection()) {
      return this._copyContainerSelection(selection);
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

  this._copyPropertySelection = function(selection) {
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
    _.each(annotations, function(anno) {
      var data = _.deepclone(anno.toJSON());
      data.path = ['text', 'content'];
      data.startOffset = Math.max(offset, anno.startOffset)-offset;
      data.endOffset = Math.min(endOffset, anno.endOffset)-offset;
      copy.create(data);
    });
    return copy;
  };

  this._copyContainerSelection = function(selection) {
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
        copy.create(_.deepclone(annotations[j].toJSON()));
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

  this._pasteAnnotatedText = function(tx, copy) {
    // extract text from the copy
    var nodes = copy.get('content').nodes;
    var textPath = [nodes[0], 'content'];
    var text = copy.get(textPath);
    var annotations = copy.getIndex('annotations').get(textPath);
    // insert plain text
    var selection = tx.selection;
    var path = selection.start.path;
    var offset = selection.start.offset;
    tx.update(path, { insert: { offset: offset, value: text } } );
    Annotations.insertedText(tx, selection.start, text.length);
    tx.selection = tx.createSelection({
      type: 'property',
      path: selection.start.path,
      startOffset: selection.start.offset+text.length
    });
    // copy annotations
    _.each(annotations, function(anno) {
      var data = anno.toJSON();
      data.path = path.slice(0);
      data.startOffset += offset;
      data.endOffset += offset;
      if (tx.get(data.id)) {
        data.id = _.uuid(data.type);
      }
      tx.create(data);
    });
  };

  this._pasteDocument = function(tx, doc) {
    var pasteDoc = doc;

    var container = tx.get(this.container.id);

    // Break, unless we are at the last character of a node,
    // then we can simply insert after the node
    var startComp = container.getComponent(tx.selection.start.path);
    var startNodeComp = startComp.parentNode;
    var insertPos;
    if ( startComp === _.last(startNodeComp.components) &&
      tx.get(startComp.path).length === tx.selection.start.offset )
    {
      insertPos = container.getPosition(tx.selection.start.path[0]) + 1;
    } else {
      this._break(tx);
      // _break() sets a new selection
      insertPos = container.getPosition(tx.selection.start.path[0]);
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
        node.id = _.uuid(node.type);
      }
      tx.create(node);
      container.show(node.id, insertPos++);
      insertedNodes.push(node);

      // transfer annotations
      // what about nodes that are referenced by annotations?
      var annos = annoIndex.get(nodeId);
      for (var j = 0; j < annos.length; j++) {
        var data = annos[j].toJSON();
        if (node.id !== nodeId) {
          data.path[0] = node.id;
        }
        if (tx.get(data.id)) {
          data.id = _.uuid(data.type);
        }
        tx.create(data);
      }
    }

    if (insertedNodes.length === 0) return;

    // set a new selection
    var lastId = _.last(insertedNodes).id;
    var lastComp = _.last(container.getComponentsForNode(lastId));
    var lastLength = tx.get(lastComp.path).length;
    // This version turned out to be useful in some situations
    // as it hightlights the pasted content
    // we leave it here for debugging
    if (false) {
      var firstId = insertedNodes[0].id;
      var firstComp = container.getComponentsForNode(firstId)[0];
      tx.selection = tx.createSelection({
        type: 'container',
        containerId: container.id,
        startPath: firstComp.path,
        startOffset: 0,
        endPath: lastComp.path,
        endOffset: lastLength
      });
    } else {
      tx.selection = tx.createSelection({
        type: 'property',
        path: lastComp.path,
        startOffset: lastLength
      });
    }
  };
};

OO.inherit(ContainerEditor, FormEditor);

module.exports = ContainerEditor;
