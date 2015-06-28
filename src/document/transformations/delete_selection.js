'use strict';

var deleteCharacter = require('./delete_character');
var Annotations = require('../annotation_updates');
var createSelection = require('../create_selection');

/* jshint latedef:false */

/**
 * Deletes the current selection (`state.selection`).
 */
function deleteSelection(tx, args, state) {
  if (state.selection.isCollapsed()) {
    return deleteCharacter(tx, args, state);
  } else if (state.selection.isPropertySelection()) {
    deleteProperty(tx, {}, state);
  } else {
    // deal with container deletes
    deleteContainerSelection(tx, {}, state);
  }
}

function deleteProperty(tx, args, state) {
  var range = state.selection.getRange();
  var path = range.start.path;
  var startOffset = range.start.offset;
  var endOffset = range.end.offset;
  tx.update(path, { delete: { start: startOffset, end: endOffset } });
  Annotations.deletedText(tx, path, startOffset, endOffset);
  state.selection = createSelection(path, startOffset);
}

function deleteContainerSelection(tx, args, state) {
  /* jshint unused:false */
}

module.exports = deleteSelection;
