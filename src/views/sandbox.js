"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var View = require("substance-application").View;
var TestCenter = require("substance-test").TestCenter;
var EditorView = require("./editor");


// SandboxView Constructor
// ==========================================================================

var SandboxView = function(controller) {
  View.call(this);

  this.controller = controller;

  // Handle state transitions
  // --------
  
  this.listenTo(this.controller, 'context-changed', this.onContextChanged);
};

SandboxView.Prototype = function() {

  // Session Event handlers
  // ==========================================================================
  //

  this.onContextChanged = function(context) {
    if (context === "editor") {
      this.openEditor();
    } else if (context === "library") {
      this.openLibrary();
    } else if (context === "test_center") {
      this.openTestCenter();
    } else {
      console.error("Unknown application context: " + context);
    }
  };


  // Open Library
  // ----------
  //

  this.openLibrary = function() {
    var view = this.controller.library.createView();
    this.replaceMainView('library', view);
  };


  // Open Editor
  // ----------
  //

  this.openEditor = function() {
    var view = this.controller.editor.createView();
    this.replaceMainView('editor', view);
  };

  // Open TestCenter
  // ----------
  //

  this.openTestCenter = function(options) {
    // TODO: can this be improved? does TestCenter really need a router?
    var view = new TestCenter(this.controller.testRunner, options);
    this.replaceMainView('test_center', view);
  };


  // Rendering
  // ==========================================================================
  //

  this.replaceMainView = function(name, view) {
    $('body').removeClass().addClass('current-view '+name);

    // HACK, since this caused weird issues
    // Bring back at some point!
    // if (this.mainView && this.mainView !== view) {
    //   console.log('disposing it..');
    //   this.mainView.dispose();
    // }

    this.mainView = view;
    this.$('#container').html(view.render().el);
  };

  this.render = function() {

    this.$el.html(html.tpl('substance', this.controller.session));
    return this;
  };

  this.dispose = function() {
    this.stopListening();
    if (this.mainView) this.mainView.dispose();
  };
};


// Export
// --------

SandboxView.Prototype.prototype = View.prototype;
SandboxView.prototype = new SandboxView.Prototype();

module.exports = SandboxView;
