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
    this.emit('toolstate:changed', newState, this, oldState);
  };

  this.getToolState = function() {
    return this.state;
  };

  this.setEnabled = function() {
    this.setToolState({
      enabled: true,
      selected: false
    });
  };

  this.setDisabled = function() {
    this.setToolState({
      enabled: false,
      selected: false
    });
  };

  this.disableTool = function() {
    console.error('DEPRICATED: use tool.setDisabled()');
    this.setDisabled();
  };

  this.setSelected = function() {
    this.setToolState({
      enabled: true,
      selected: true
    });
  };

  /* jshint unused:false */
  this.update = function(surface, sel) {
    if (this.needsEnabledSurface && !surface.isEnabled()) {
      return this.setEnabled(false);
    }
  };
};

Substance.inherit(Tool, Substance.EventEmitter);

module.exports = Tool;
