'use strict';

var Substance = require('../../basics');
var deleteSelection = require('./delete_selection');
var Annotations = require('../annotation_updates');

/* jshint latedef: false */

/**
 * @params args object with fields `selection`, `containerId`
 */
function breakNode(tx, args) {
  var selection = args.selection;
  if (!selection.isCollapsed()) {
    deleteSelection(tx, args);
  }
  var range = selection.getRange();
  var node = tx.get(range.start.path[0]);

  // TODO: we want to allow custom break behaviors
  // for that to happen we need to learn more

  if (node.isInstanceOf('text')) {
    return breakTextNode(tx, args);
  } else {
    console.info("Breaking is not supported for node type %s.", node.type);
  }
}

function breakTextNode(tx, args) {
  var selection = args.selection;
  var containerId = args.containerId;
  if (!selection.isPropertySelection()) {
    throw new Error('Expected property selection.');
  }
  var range = selection.getRange();
  var path = range.start.path;
  var offset = range.startoffset;
  var node = tx.get(path[0]);

  // split the text property and create a new paragraph node with trailing text and annotations transferred
  var text = node.content;
  var container = tx.get(containerId);
  var nodePos = container.getPosition(node.id);
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
    container.show(id, nodePos);
    selection = tx.createSelection({
      type: 'property',
      path: path,
      startOffset: 0
    });
  } else {
    // create a new node
    tx.create({
      id: id,
      type: tx.getSchema().getDefaultTextType(),
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
    container.show(id, nodePos+1);
    // update the selection
    selection = tx.createSelection({
      type: 'property',
      path: newPath,
      startOffset: 0
    });
  }
  return { selection: selection };
}

module.exports = breakNode;
