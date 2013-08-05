"use strict";

var _ = require("underscore");
var Substance = require("../substance");
var Session = require("../models/session");
var LibraryController = require("./library_controller");
var EditorController = require("./editor_controller");
var util = Substance.util;
var Controller = Substance.Application.Controller;
var SandboxView = require('../views/sandbox');
var Test = Substance.Test;
var Router = require("../router");

// The Substance.Sandbox App

// Substance.Sandbox.Controller
// -----------------
//
// Main Application Controller

var SandboxController = function(env) {
  Controller.call(this);
  this.session = new Session(env);

  // HACK: probably this can be straightened
  this.router = new Router({controller: this});

  // Create main view
  this.view = new SandboxView(this);

  // Main controls
  this.on('open:editor', this.openEditor);
  this.on('open:library', this.openLibrary);
  this.on('open:login', this.openLogin);
  this.on('open:test_center', this.openTestCenter);
};


SandboxController.Prototype = function() {

  // Transitions
  // ===================================

  this.openEditor = function(documentId) {
    var that = this;
    this.session.loadDocument(documentId || 'lorem_ipsum', function(err, doc) {
      if (err) throw "Loading failed";
      that.editor = new EditorController(doc);
      that.updateState('editor');
    });
  };

  this.openLibrary = function() {
    this.library = new LibraryController();
    this.updateState('library');
  };

  // Test control center
  this.openTestCenter = function(suite) {
    this.testRunner = new Test.Runner();
    this.updateState('test_center', {report: suite});

    // TODO: Run all suites instead of just choosing a default
    this.runSuite(suite);
  };

  // Provides an array of (context, controller) tuples that describe the
  // current state of responsibilities
  // --------
  // 
  // E.g., when a document is opened:
  //    ["application", "document"]
  // with controllers taking responisbility:
  //    [this, this.document]
  //
  // The child controller (e.g., document) should itself be allowed to have sub-controllers.
  // For sake of prototyping this is implemented manually right now.
  // TODO: discuss naming

  this.getActiveControllers = function() {
    var result = [ ["sandbox", this] ];

    var state = this.state;

    if (state === "editor") {
      result = result.concat(this.editor.getActiveControllers());
    } else if (state === "test_center") {
      result.push(["test_center", this.testRunner]);
    }

    return result;
  };


  // Load and run testsuite
  // --------

  this.runSuite = function(suite, cb) {
    cb = cb || function(err) {
      if (err) console.log('ERROR', err);
    };

    if (!suite) return this.runAllSuites(cb);
    this.testRunner.runSuite(suite, cb);
  };


  // Load and run testsuite
  // --------

  this.runAllSuites = function(cb) {
    var suites = this.testRunner.getTestSuites();
    var testRunner = this.testRunner;

    var funcs = _.map(suites, function(suite, suiteName) {
      return function(data, cb) {
        testRunner.runSuite(suiteName, cb);
      };
    });

    util.async.sequential({
      functions: funcs,
      stopOnError: false
    }, cb);
  };
};


// Exports
// --------

SandboxController.Prototype.prototype = Controller.prototype;
SandboxController.prototype = new SandboxController.Prototype();
_.extend(SandboxController.prototype, util.Events);


module.exports = SandboxController;
