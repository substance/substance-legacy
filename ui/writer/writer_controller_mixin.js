var Substance = require("substance");
var Document = Substance.Document;
var _ = require("substance/helpers");

var ToolManager = require("substance").Surface.ToolManager;
var Highlight = require("../text_property").Highlight;
var ExtensionManager = require("../extension_manager");
var DocumentController = require("../document_controller_mixin");

var coreTools = require("./tools");

// Mixin to control a Writer
// ----------------

var WriterControllerMixin = _.extend({}, DocumentController, {
  // Get all available tools from core and extensions
  getTools: function() {
    return coreTools.concat(this.extensionManager.getTools());
  }
});


module.exports = WriterControllerMixin;
