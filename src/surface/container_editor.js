'use strict';

var Substance = require('../basics');
var Document = require('../document');
var FormEditor = require('./form_editor');
var Annotations = Document.AnnotationUpdates;
var Selection = Document.Selection;

function ContainerEditor(containerName, doc) {
  FormEditor.call(this, doc);
  this.containerName = containerName;

  this.mergeBehavior = {};
  this.breakBehavior = {};
  this.deleteBehavior = {};
  this.defineBehavior();
}

ContainerEditor.Prototype = function() {

  // TODO: we should make paragraph the default type
  // as this seems to be a more natural choice
  this.defaultTextType = 'paragraph';

  // Define custom editing behavior
  //
  // Register custom handlers for merge and break.
  // Example:
  //
  //  To support text nodes being merged into a figure node:
  //    this.mergeBehavior.figure = { 'text': function() {...} }
  //
  //  To support breaking a figure's caption:
  //    this.breakBehavior.figure = function(doc, node, path, offset) {...}
  //
  this.defineBehavior = function() {};

  this.isContainerEditor = function() {
    return true;
  };

  this.setContainer = function(container) {
    this.container = container;
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

  this._getBreakBehavior = function(node) {
    var behavior = null;
    if (this.breakBehavior[node.type]) {
      behavior = this.breakBehavior[node.type];
    } else if (node.isInstanceOf('text')) {
      behavior = this._breakTextNode;
    }
    if (!behavior) {
      console.info("No breaking behavior defined for %s", node.type);
    }
    return behavior;
  };

  this._break = function(tx) {
    var range = tx.selection.getRange();
    var component = this.container.getComponent(range.start.path);
    var node = tx.get(component.path[0]);
    var offset = range.start.offset;
    var breakBehavior = this._getBreakBehavior(node);
    if (breakBehavior) {
      breakBehavior.call(this, tx, node, component.path, offset);
    }
  };

  this._breakTextNode = function(tx, node, path, offset) {
    // split the text property and create a new paragraph node with trailing text and annotations transferred
    var text = node.content;
    var containerNode = tx.get(this.containerName);
    var nodePos = containerNode.getPosition(node.id);
    var id = Substance.uuid(node.type);
    var newPath = [id, 'content'];
    // when breaking at the first position, a new node of the same
    // type will be inserted.
    if (offset === 0) {
      tx.create({
        id: id,
        type: node.type,
        content: ""
      });
      // show the new node
      containerNode.show(id, nodePos);
      tx.selection = Selection.create(path, 0);
    } else {
      // create a new node
      tx.create({
        id: id,
        type: this.defaultTextType,
        content: text.substring(offset)
      });
      if (offset < text.length) {
        // transfer annotations which are after offset to the new node
        Annotations.transferAnnotations(tx, path, offset, [id, 'content'], 0);
        // truncate the original property
        tx.update(path, {
          delete: { start: offset, end: text.length }
        });
      }
      // show the new node
      containerNode.show(id, nodePos+1);
      // update the selection
      tx.selection = Selection.create(newPath, 0);
    }
  };

  this._getMergeBehavior = function(node, otherNode) {
    var merge = this.mergeBehavior;
    var behavior = null;
    if (merge[node.type] && merge[node.type][otherNode.type]) {
      behavior = merge[node.type][otherNode.type];
    }
    // special convenience to define behaviors when text nodes are involved
    // E.g., you might want to define how to merge a text node into a figure
    else if (node.isInstanceOf('text') && otherNode.isInstanceOf('text')) {
      behavior = this._mergeTextNodes;
    } else if (node.isInstanceOf('text') && merge['text']) {
      behavior = merge['text'][otherNode.type];
    } else if (otherNode.isInstanceOf('text') && merge[node.type]) {
      behavior = merge[node.type]['text'];
    }
    if (!behavior) {
      console.info("No merge behavior defined for %s <- %s", node.type, otherNode.type);
    }
    return behavior;
  };

  // low-level merge implementation
  this._merge = function(tx, path, dir) {
    var component = this.container.getComponent(path);
    var otherPath, mergeBehavior;
    if (dir === 'right' && component.next) {
      this._mergeComponents(tx, component, component.next);
    } else if (dir === 'left' && component.previous) {
      this._mergeComponents(tx, component.previous, component);
    } else {
      // No behavior defined for this merge
    }
  };

  this._mergeComponents = function(tx, firstComp, secondComp) {
    var firstNode = tx.get(firstComp.parentNode.id);
    var secondNode = tx.get(secondComp.parentNode.id);
    var mergeBehavior = this._getMergeBehavior(firstNode, secondNode);
    if (mergeBehavior) {
      mergeBehavior.call(this, tx, firstComp, secondComp);
    }
  };


  this._mergeTextNodes = function(tx, firstComp, secondComp) {
    var firstPath = firstComp.path;
    var firstText = tx.get(firstPath);
    var firstLength = firstText.length;
    var secondPath = secondComp.path;
    var secondText = tx.get(secondPath);
    var containerNode = tx.get(this.containerName);
    // append the second text
    tx.update(firstPath, { insert: { offset: firstLength, value: secondText } });
    // transfer annotations
    Annotations.transferAnnotations(tx, secondPath, 0, firstPath, firstLength);
    // hide the second node
    containerNode.hide(secondPath[0]);
    // delete the second node
    tx.delete(secondPath[0]);
    // set the selection to the end of the first component
    tx.selection = Selection.create(firstPath, firstLength);
  };

  this._getDeleteBehavior = function(node) {
    var behavior = null;
    if (this.deleteBehavior[node.type]) {
      behavior = this.deleteBehavior[node.type];
    }
    return behavior;
  };

  this._deleteContainerSelection = function(tx) {
    var sel = tx.selection.getRange();
    var nodeSels = this._getNodeSelection(tx, sel);
    // apply deletion backwards so that we do not to recompute array positions
    for (var idx = nodeSels.length - 1; idx >= 0; idx--) {
      var nodeSel = nodeSels[idx];
      if (nodeSel.isFully && !nodeSel.node.isResilient()) {
        this._deleteNode(tx, nodeSel.node);
      } else {
        this._deleteNodePartially(tx, nodeSel);
      }
    }
    // do a merge
    if (nodeSels.length>1) {
      var firstSel = nodeSels[0];
      var lastSel = nodeSels[nodeSels.length-1];
      if (firstSel.isFully || lastSel.isFully) {
        // TODO: think about if we want to merge in those cases
      } else {
        var firstComp = firstSel.components[0];
        var secondComp = Substance.last(lastSel.components);
        this._mergeComponents(tx, firstComp, secondComp);
      }
    }
  };

  this._deleteNode = function(tx, nodeSel) {
    var deleteBehavior = this._getDeleteBehavior(nodeSel.node);
    if (deleteBehavior) {
      deleteBehavior.call(this, tx, nodeSel);
    } else if (nodeSel.isNested) {
      throw new Error('Contract: you must provide a deleteBehavior for nested node types.');
    } else {
      // otherwise we can just delete the node
      var nodeId = nodeSel.node.id;
      var containerNode = tx.get(this.containerName);
      // remove from view first
      containerNode.hide(nodeId);
      // remove all associated annotations
      var annos = tx.getIndex('annotations').get(nodeId);
      var i;
      for (i = 0; i < annos.length; i++) {
        tx.delete(annos[i].id);
      }
      annos = tx.getIndex('container-annotations').get(nodeId);
      for (i = 0; i < annos.length; i++) {
        tx.delete(annos[i].id);
      }
      // and then permanently delete
      tx.delete(nodeSel.node.id);
    }
  };

  this._deleteNodePartially = function(tx, nodeSel) {
    var deleteBehavior = this._getDeleteBehavior(nodeSel.node);
    if (deleteBehavior) {
      deleteBehavior.call(this, tx, nodeSel);
    } else if (nodeSel.isNested) {
      throw new Error('Contract: you must provide a deleteBehavior for nested node types.');
    } else {
      // Just go through all components and apply a property deletion
      var components = nodeSel.components;
      var length = components.length;
      for (var i = 0; i < length; i++) {
        var comp = components[i];
        var startOffset = 0;
        var endOffset = tx.get(comp.path).length;
        if (i === 0) {
          startOffset = nodeSel.startOffset;
        }
        if (i === length-1) {
          endOffset = nodeSel.endOffset;
        }
        this._deleteProperty(tx, comp.path, startOffset, endOffset);
      }
    }
  };

  this._getNodeSelection = function(doc, range) {
    var result = [];
    var groups = {};
    var container = this.container;
    var components = container.getComponentsForRange(range);
    var isNested;
    function _getRoot(comp) {
      isNested = false;
      var node = doc.get(comp.parentNode.id);
      while (node.hasParent()) {
        isNested = true;
        node = node.getParentNode();
      }
      return node;
    }
    for (var i = 0; i < components.length; i++) {
      var comp = components[i];
      var node = _getRoot(comp);
      var nodeId = node.id;
      var nodeGroup;
      if (!groups[nodeId]) {
        nodeGroup = {
          node: node,
          isFully: true,
          components: []
        };
        groups[nodeId] = nodeGroup;
        result.push(nodeGroup);
      }
      nodeGroup = groups[nodeId];
      nodeGroup.components.push(comp);
      if (isNested) {
        nodeGroup.isNested = true;
      }
    }
    // finally we analyze the first and last node-selection
    // if these
    var startComp = components[0];
    var endComp = components[components.length-1];
    var startNodeSel = result[0];
    var endNodeSel = result[result.length-1];
    var startLen = doc.get(startComp.path).length;
    var endLen = doc.get(endComp.path).length;
    if (range.start.offset > 0 ||
      (startComp.hasPrevious() && _getRoot(startComp.getPrevious()) !== startNodeSel.node))
    {
      startNodeSel.isFully = false;
      startNodeSel.startOffset = range.start.offset;
      startNodeSel.endOffset = startLen;
    }
    if (result.length > 1 &&
        (range.end.offset < endLen ||
          (endComp.hasNext() && _getRoot(endComp.getNext()) !== endNodeSel.node))
       ) {
      endNodeSel.isFully = false;
      endNodeSel.startOffset = 0;
      endNodeSel.endOffset = range.end.offset;
    }
    return result;
  };

};

Substance.inherit(ContainerEditor, FormEditor);

module.exports = ContainerEditor;