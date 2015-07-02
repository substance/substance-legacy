'use strict';

var Tool = require('../tool');

var InsertColumnsTool = Tool.extend({

  name: "insert_columns",

  update: function(surface, sel) {
    this.surface = surface; // IMPORTANT!
    // Set disabled when not a property selection
    console.log('####', sel.toString(), surface.isEnabled(), sel.isNull(), sel.isTableSelection());
    if (!surface.isEnabled() || sel.isNull() || !sel.isTableSelection()) {
      return this.setDisabled();
    }
    this.setToolState({
      surface: surface,
      sel: sel,
      disabled: false
    });
  },

  performAction: function() {
    this.surface.transaction(function(tx, args) {
      console.log('TODO: insert columns');
      return args;
    });
  },

});

module.exports = InsertColumnsTool;
