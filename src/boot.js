// Gets called when the DOM is ready
$(function() { "use strict";
  var root = window;
  var Substance = root.Substance;
  var Backbone = root.Backbone;
  var Router = root.Router;
  var html = Substance.util.html;

  // Compile templates
  html.compileTemplate('test_center');
  html.compileTemplate('test_report');
  html.compileTemplate('test_action');

  Substance.client_type = 'browser';
  Substance.env = 'development';

  // loadConfigurations(function(err, configs) {
  // Substance.configurations = JSON.parse(JSON.stringify(configs));
  // delete Substance.configurations.env;

  // Initially set env based on config value
  // if (!Substance.settings.getItem('env')) {
  //   Substance.settings.setItem('env', configs.env || 'development');
  // }



  // Initialization
  // -----------------

  // Main Application controller
  Substance.app = new Substance.Application.Controller(Substance.env);

  // Start the engines
  Substance.appView = new Substance.Application.View(Substance.app);

  // Render main app
  $('body').html(Substance.appView.render().el);

  // Setup router (talks to the main app controller)
  Substance.router = new Router({controller: Substance.app});

  Backbone.history.start();

  // Preliminary keyboard configuration stuff...
  // TODO: discuss where this should be placed...
  // e.g., could be an optional configuration for the session itself

  var keyboard = new Substance.Keyboard(Substance.app);
  Substance.app.on("state-changed", keyboard.stateChanged, keyboard);

  // TODO: it would be nice to add a built-in handler for handling 'typed text'
  // and use it in a declarative way e.g.:
  // {"command": "write", keys: "typed-text" }
  keyboard.setDefaultHandler("application.document.editor", function(character, modifiers, e) {
    if (e.type === "keypress") {
      var str = null;

      // TODO: we need a better technique to detect typed characters
      // This approach assumes, that a typed character comes with a unicode interpretation
      // However, the actual mapped key is given by the e.charCode
      if (e.keyIdentifier.substring(0,2) === "U+") {
        str = String.fromCharCode(e.charCode);
      }

      if (str !== null) {
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

  Substance.keyboard = keyboard;
  // });

});
