var Substance = require("../basics");

function Tool() {
  Substance.EventEmitter.call(this);

  // proxy is managed by the application provided dynamic access to
  // the current surface
  this.proxy = null;

  this.state = {
    // if the tool can be applied at all
    enabled: false,
    // if the tool has been applied and can be toggled
    selected: false
  };
}

Tool.Prototype = function() {

  this.needsEnabledSurface = true;

  this.getName = function() {
    return this.constructor.static.name;
  };

  this.getSurface = function() {
    return this.proxy.getSurface();
  };

  this.getDocument = function() {
    var surface = this.proxy.getSurface();
    if (surface) {
      return surface.getDocument();
    }
  };

  this.getContainer = function() {
    var surface = this.proxy.getSurface();
    if (surface) {
      var editor = surface.getEditor();
      if (editor.isContainerEditor()) {
        return editor.getContainer();
      }
    }
  };

  this.setToolState = function(newState) {
    var oldState = this.state;
    this.state = newState;
    this.emit('tool-state:changed', newState, oldState, this);
  };

  this.getToolState = function() {
    return this.state;
  };

  this.disableTool = function() {
    this.setToolState({
      enabled: false,
      selected: false
    });
  };

  /* jshint unused:false */
  this.update = function(surface, sel) {
    if (this.needsEnabledSurface && !surface.isEnabled()) {
      return this.setToolState({
        active: false,
        selected: false
      });
    }
  };
};

Substance.inherit(Tool, Substance.EventEmitter);

module.exports = Tool;
