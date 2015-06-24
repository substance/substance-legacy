'use strict';

var deleteSelection = require('./delete_selection');
var Annotations = require('../annotation_updates');
var createSelection = require('../create_selection');

var insertText = function(tx, args, state) {
  var text = args.text;
  if (!state.selection.isCollapsed()) {
    deleteSelection(tx, { direction: 'right'}, state);
  }
  var range = state.selection.getRange();
  tx.update(range.start.path, { insert: { offset: range.start.offset, value: text } } );
  Annotations.insertedText(tx, range.start, text.length);
  state.selection = createSelection(range.start.path, range.start.offset + text.length);
};

module.exports = insertText;
