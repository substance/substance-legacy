'use strict';

var deleteSelection = require('./delete_selection');
var breakNode = require('./break_node');

function insertNode(tx, args, state) {
  var node = args.node;
  if (!this.selection.isCollapsed()) {
    deleteSelection(tx, {}, state);
  }
  breakNode(tx, {}, args);
  var container = tx.get(this.container.id);
  if (!tx.get(node.id)) {
    node = tx.create(node);
  }
  var comp = container.getComponent(tx.selection.start.path);
  var pos = container.getPosition(comp.rootId);
  container.show(node.id, pos);
  // TODO: set cursor to first position of inserted node
}

module.exports = insertNode;
