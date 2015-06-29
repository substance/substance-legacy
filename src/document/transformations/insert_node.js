'use strict';

var deleteSelection = require('./delete_selection');
var breakNode = require('./break_node');

function insertNode(tx, args) {
  var selection = args.selection;
  var node = args.node;
  var containerId = args.containerId;
  var container = tx.get(containerId);
  var result;
  if (!selection.isCollapsed()) {
    result = deleteSelection(tx, args);
    selection = result.selection;
  }
  result = breakNode(tx, args);
  selection = result.selection;
  if (!tx.get(node.id)) {
    node = tx.create(node);
  }
  var comp = container.getComponent(tx.selection.start.path);
  var pos = container.getPosition(comp.rootId);
  container.show(node.id, pos);
  // TODO: set cursor to first position of inserted node
  return {
    selection: null
  };
}

module.exports = insertNode;
