"use strict";

var _ = require("underscore");
var Substance = require("../substance");
var View = Substance.Application.View;
var TestCenter = Substance.Test.TestCenter;
var EditorView = require("./editor");


// SandboxView Constructor
// ==========================================================================

var SandboxView = function(controller) {
  View.call(this);

  this.controller = controller;

  // Handle state transitions
  // --------
  this.listenTo(this.controller, 'state-changed', this.onStateChanged);

  // DOM events
  // -----------

  // this.$el.delegate(".action.logout", "click", _.bind(this.logout, this));
};

SandboxView.Prototype = function() {

  // Session Event handlers
  // ==========================================================================
  //

  this.onStateChanged = function(newState) {
    if (newState === "editor") {
      this.openEditor();
    } else if (newState === "test_center") {
      this.openTestCenter();
    } else {
      console.log("Unknown application state: " + newState);
    }
  };

  // Open Editor
  // ----------
  //

  this.openEditor = function() {
    // Application controller has a editor controller ready
    // -> pass it to the editor view
    var view = new EditorView(this.controller.editor);
    this.replaceMainView('editor', view);
  };

  // Open TestCenter
  // ----------
  //

  this.openTestCenter = function() {
    var view = new TestCenter(this.controller.testRunner);
    this.replaceMainView('test_center', view);
  };


  // Rendering
  // ==========================================================================
  //

  this.replaceMainView = function(name, view) {
    this.render();
    $('body').removeClass().addClass('current-view '+name);

    if (this.mainView) {
      this.mainView.dispose();
    }

    this.mainView = view;
    this.$('#container').html(this.mainView.render().el);
  };

  this.render = function() {
    // console.log('Session', Substance.session);
    this.$el.html(_.tpl('substance', this.controller.session));
    return this;
  };
};


// Export
// --------

SandboxView.Prototype.prototype = View.prototype;
SandboxView.prototype = new SandboxView.Prototype();

module.exports = SandboxView;
