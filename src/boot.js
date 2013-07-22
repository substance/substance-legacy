"use strict";

var _ = require("underscore");

// Creates a Substance instance
var boot = function() {

  // create a clone of the provided module as we store data into it
  var Substance = _.clone(require("./substance.js"));

  var SandboxController = require("./controllers/sandbox_controller");
  var SandboxView = require("./views/sandbox");
  var Keyboard = Substance.Commander.Keyboard;

  var Backbone = require("../lib/backbone");
  var Router = require("./router");

  var html = Substance.util.html;

  // Compile templates
  html.compileTemplate('test_center');
  html.compileTemplate('test_report');

  Substance.client_type = 'browser';
  Substance.env = 'development';

  // Initialization
  // -----------------

  // Main Application controller
  Substance.app = new SandboxController(Substance.env);

  // Start the engines
  Substance.appView = new SandboxView(Substance.app);
  $('body').html(Substance.appView.render().el);

  // Setup router (talks to the main app controller)
  Substance.router = new Router({controller: Substance.app});
  Backbone.history.start();

  // Preliminary keyboard configuration stuff...
  // TODO: discuss where this should be placed...
  // e.g., could be an optional configuration for the session itself

  var keyboard = new Keyboard(Substance.app);

  Substance.app.on("state-changed", keyboard.stateChanged, keyboard);

  // TODO: it would be nice to add a built-in handler for handling 'typed text'
  // and use it in a declarative way e.g.:
  // {"command": "write", keys: "typed-text" }
  keyboard.setDefaultHandler("sandbox.editor.writer", function(character, modifiers, e) {
    if (e.type === "keypress") {
      var str = null;

      // TODO: try to find out which is the best way to detect typed characters
      str = String.fromCharCode(e.charCode);
      if (str !== null && str.length > 0) {
        // TODO: consume the event
        e.preventDefault();
        return {command: "write", args: [str]};
      }
    }
    return false;
  });

  var keymapFile = "/config/default.keymap";
  $.getJSON(keymapFile, function(data) {
    keyboard.registerBindings(data);
  }).error(function(err) {
    console.error("Could not load keyboard mapping", err, keymapFile);
  });

  Substance.app.keyboard = keyboard;

  return Substance;
};

module.exports = boot;
