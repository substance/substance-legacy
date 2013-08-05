"use strict";

var _ = require("underscore");
var util = require('substance-util');
var html = util.html;
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

  // this.$el.delegate(".open-document", "click", _.bind(this.convertDocument, this));
};

SandboxView.Prototype = function() {

  // Session Event handlers
  // ==========================================================================
  //

  this.onStateChanged = function(newState, oldState, options) {
    if (newState === "editor") {
      this.openEditor();
    } else if (newState === "library") {
      this.openLibrary(options);
    } else if (newState === "test_center") {
      this.openTestCenter(options);
    } else {
      console.log("Unknown application state: " + newState);
    }
  };

  this.convertDocument = function() {
    console.log('converting..');
  };

  // Open Library
  // ----------
  //

  this.openLibrary = function() {
    // Application controller has a editor controller ready
    // -> pass it to the editor view
    // var view = new EditorView(this.controller.editor.view);
    var view = this.controller.library.createView();
    this.replaceMainView('library', view);
  };


  // Open Editor
  // ----------
  //

  this.openEditor = function() {
    // Application controller has a editor controller ready
    // -> pass it to the editor view
    // var view = new EditorView(this.controller.editor.view);
    var view = this.controller.editor.createView();
    this.replaceMainView('editor', view);
  };

  // Open TestCenter
  // ----------
  //

  this.openTestCenter = function(options) {
    // TODO: can this be improved? does TestCenter really need a router?
    var view = new TestCenter(this.controller.testRunner, this.controller.router, options);
    this.replaceMainView('test_center', view);
  };


  // Rendering
  // ==========================================================================
  //

  this.replaceMainView = function(name, view) {
    $('body').removeClass().addClass('current-view '+name);

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
