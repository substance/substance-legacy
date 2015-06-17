"use strict";

var Substance = require('../basics');

var ToolRegistry = function() {
  Substance.Registry.call(this);
};

ToolRegistry.Prototype = function() {

  this.registerTool = function(ToolClass) {
    var name = ToolClass.static.name;
    if (!name) {
      throw new Error('Contract: a Tool class must have a name.');
    }
    this.add(name, new ToolClass());
  };

  this.registerTools = function(toolClasses) {
    for (var i = 0; i < toolClasses.length; i++) {
      this.registerTool(toolClasses[i]);
    }
  };

};

Substance.inherit(ToolRegistry, Substance.Registry);

module.exports = ToolRegistry;
