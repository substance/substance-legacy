"use strict";

var _ = require("underscore");
var Application = require("substance-application");
var SandboxController = require("./controllers/sandbox_controller");
var Keyboard = require("substance-commander").Keyboard;
var util = require("substance-util");
var html = util.html;

// The Substance Sandbox application
// ========
//

var Substance = function(config) {
  config = config || {};
  config.routes = require("../config/routes.json");
  console.log(config.routes);
  Application.call(this, config);

  this.controller = new SandboxController();
  // this.view = this.controller.createView();
};

// Expose submodules
// --------
// 

Substance.Article      = require("substance-article");
Substance.Outline      = require("lens-outline");
Substance.util         = require("substance-util");
Substance.Test         = require("substance-test");
Substance.Application  = require("substance-application");
Substance.Commander    = require("substance-commander");
Substance.Operator     = require("substance-operator");
Substance.Chronicle    = require("substance-chronicle");
Substance.Data         = require("substance-data");
Substance.Document     = require("substance-document");
Substance.Article      = require("substance-article");
Substance.RegExp       = require("substance-regexp");
Substance.Surface      = require("substance-surface");


// Register tests
// --------
// 

require("substance-application/tests");
require("substance-converter/tests");
require("substance-operator/tests");
require("substance-chronicle/tests");
require("substance-data/tests");
require("substance-document/tests");
//require("substance-article/tests");
require("substance-store/tests");
require("substance-surface/tests");


Substance.Prototype = function() {

  // Keyboard registration
  // --------
  // 
  // TODO: discuss where this should be placed...
  // e.g., could be an optional configuration for the session itself

  this.initKeyboard = function() {
    this.keyboard = new Keyboard(this.controller);

    this.controller.on("state-changed", this.keyboard.stateChanged, this.keyboard);
    this.keyboard.set('TRIGGER_PREFIX_COMBOS', true);

    var keymap = require("../config/default.keymap.json");
    this.keyboard.registerBindings(keymap);
  };

  // Render main view
  // --------

  this.render = function() {
    this.view = this.controller.createView();
    console.log('meh', this.$el[0]);
    this.$el.html(this.view.render().el);
    this.initKeyboard();
    return this;
  };
};


Substance.Prototype.prototype = Application.prototype;
Substance.prototype = new Substance.Prototype();
Substance.prototype.constructor = Substance;

module.exports = Substance;