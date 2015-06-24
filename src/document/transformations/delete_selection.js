'use strict';

var mergeNodes = require('./merge_nodes');
var Annotations = require('../annotation_updates');
var createSelection = require('../create_selection');

var deleteProperty = function(tx, args, state) {
  // if a property selection but not collapsed
  // simply delete the selected area
  tx.update(args.path, { delete: { start: args.startOffset, end: args.endOffset } });
  Annotations.deletedText(tx, args.path, args.startOffset, args.endOffset);
  state.selection = createSelection(args.path, args.startOffset);
};

var deleteContainerSelection = function(tx, args, state) {

};

var deleteSelection = function(tx, args, state) {
  var direction = args.direction;
  var range = state.selection.getRange();
  var startChar, endChar;
  // if collapsed see if we are at the start or the end
  // and try to merge
  if (state.selection.isCollapsed()) {
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
  } else if (state.selection.isPropertySelection()) {
    deleteProperty(tx, {
      path: range.start.path,
      startOffset: range.start.offset,
      endOffset: range.end.offset
    }, state);
  } else {
    // deal with container deletes
    deleteContainerSelection(tx, { direction: direction }, state);
  }
};

module.exports = deleteSelection;
