"use strict";

var Substance = require('../basics');

// ToolProxy is used by Tools to access the currently active Surface.
// Usually this is used as a mixin for an application managed class.
function ToolProxy() {}

ToolProxy.Prototype = function() {

  // Provides access to the currently active surface.
  //
  this.getSurface = function() {
    throw new Error('This method must be implemented.');
  };

  this.isToolDisabled = function(name) {
    return (this._disabledTools_ && Substance.includes(this._disabledTools_, name));
  };

  // Disable tools with given names.
  // Usually tools are enabled considering a current selection.
  // Disabling this way is like blacklisting a tool from that mechanism.
  this.disableTools = function(names) {
    this._disabledTools_ = names;
  };

};

Substance.initClass(ToolProxy);

module.exports = ToolProxy;
