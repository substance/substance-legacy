"use strict";

var Substance = require('../basics');
var _ = require("../basics/helpers");

var ToolManager = function(doc, options) {
  this.doc = doc;
  this.tools = {};
  this.isToolEnabled = options.isToolEnabled;
};

ToolManager.Prototype = function() {

  this.registerTool = function(tool, name) {
    name = name || Substance.uuid();
    this.tools[name] = tool;
    if (tool.name) {
      throw new Error("Tool has already been registered");
    }
    // HACK! we store a name on the tool for later decision making
    tool.name = name;
  };

  this.unregisterTool = function(tool) {
    _.each(this.tools, function(t, name) {
      if (tool === t) {
        delete this.tools[name];
      }
    }, this);
  };

  this.updateTools = function(sel, surface) {
    _.each(this.tools, function(tool) {
      if (this.isToolEnabled(tool.name)) {
        tool.updateToolState(sel, surface);
      } else {
        tool.disableTool();
      }
    }.bind(this));
  };
};

Substance.initClass(ToolManager);

module.exports = ToolManager;
