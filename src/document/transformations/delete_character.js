'use strict';

var mergeNodes = require('./merge_nodes');
var Annotations = require('../annotation_updates');
var createSelection = require('../create_selection');

/**
 * The behavior when you press delete or backspace.
 * I.e., it starts with a collapsed PropertySelection and deletes the character before
 * or after the caret.
 * If the caret is at the begin or end it will call `mergeNodes`.
 */
var deleteCharacter = function(tx, args, state) {
  var direction = args.direction;
  var range = state.selection.getRange();
  var startChar, endChar;
  if (!state.selection.isCollapsed()) {
    throw new Error('Selection must be collapsed for transformation "deleteCharacter"');
  }
  var prop = tx.get(range.start.path);
  if ((range.start.offset === 0 && direction === 'left') ||
      (range.start.offset === prop.length && direction === 'right')) {
    mergeNodes(tx, { path: range.start.path, direction: direction }, state);
  } else {
    // simple delete one character
    startChar = (direction === 'left') ? range.start.offset-1 : range.start.offset;
    endChar = startChar+1;
    tx.update(range.start.path, { delete: { start: startChar, end: endChar } });
    Annotations.deletedText(tx, range.start.path, startChar, endChar);
    state.selection = createSelection(range.start.path, startChar);
  }
};

module.exports = deleteCharacter;
