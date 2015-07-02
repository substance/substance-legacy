'use strict';

var AnnotationTool = require('../annotation_tool');

var LinkTool = AnnotationTool.extend({

  name: "link",

  getAnnotationData: function() {
    return {
      url: "http://"
    };
  },

  update: function(surface, sel) {
    this.surface = surface;
    if ( !surface.isEnabled() || sel.isNull() || sel.isContainerSelection() ) {
      return this.setDisabled();
    }
    var doc = this.getDocument();
    var annos = doc.getAnnotationsForSelection(sel, { type: 'link' });
    var oldState = this.getToolState();
    var newState = {
      surface: surface,
      disabled: false,
      active: false,
      mode: null,
      sel: sel,
      annos: annos
    };
    if (this.canCreate(annos, sel)) {
      newState.mode = "create";
    } else if (this.canTruncate(annos, sel)) {
      newState.mode = "truncate";
      newState.active = true;
    } else if (this.canExpand(annos, sel)) {
      newState.mode = "expand";
    } else if (annos.length === 1) {
      newState.mode = "edit";
      newState.active = true;
      newState.showPopup = true;
    } else {
      return this.setDisabled();
    }
    this.setToolState(newState);
  },

  performAction: function() {
    var state = this.getToolState();
    if (state.mode === "edit") {
      this.emit('edit', this);
    } else {
      AnnotationTool.prototype.performAction.call(this);
    }
  },

});

module.exports = LinkTool;
