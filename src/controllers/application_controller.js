(function(root) {

var Substance = root.Substance;
var util = Substance.util;
var _ = root._;
var Data = Substance.Data;
var Chronicle = Substance.Chronicle;
var Document = Substance.Document;
var Session = Substance.Session;
var Editor = Substance.Editor;
var Operator = Substance.Operator;
var Test = Substance.Test;


// Application Module

var Application = Substance.Application || {};

// Substance.Application.Controller
// -----------------
//
// Main Application Controller

var ApplicationController = function(env) {
  this.session = new Session(env);

  // null state
  this.state = null;

  // Main controls
  this.on('open:editor', this.openEditor);
  this.on('open:login', this.openLogin);
  this.on('open:test_center', this.openTestCenter);
};


ApplicationController.Prototype = function() {

  // Transitions
  // ===================================

  this.openEditor = function(documentId) {
    var that = this;
    this.session.loadDocument('lorem_ipsum', function(err, doc) {
      if (err) throw "Loading failed";

      that.editor = new Editor.Controller(doc);
      that.updateState('editor');
    });
  };

  // Test control center
  this.openTestCenter = function(suite) {
    this.testRunner = new Test.Runner();
    this.updateState('test_center');

    // TODO: Run all suites instead of just choosing a default
    this.runSuite(suite || 'Document');
  };


  // Finalize state transition
  // -----------------
  //
  // Application View listens on state-changed events:
  //
  // E.g. this.handle(this.session, 'state-changed:dashboard', this.openDashboard);

  this.updateState = function(state) {
    var oldState = this.state;
    this.state = state;
    this.trigger('state-changed', this.state, oldState);
  };

  // Provides an array of (context, controller) tuples that describe the
  // current state of responsibilities
  // --------
  // TODO: discuss naming
  this.getActiveControllers = function() {
    var result = [ ["application", this] ];
    // TODO: we should specify all application states via hierarchical contexts.
    // E.g., when a document is opened:
    //    ["application", "document"]
    // with controllers taking responisbility:
    //    [this, this.document]
    //
    // The child controller (e.g., document) should itself be allowed to have sub-controllers.
    // For sake of prototyping this is implemented manually right now.
    var state = this.state;

    if (state === "document") {
      result.push(["document", this.document]);
      result.push(["editor", this.document]);
    } else if (state === "dashboard") {
      result.push(["dashboard", this.library]);
    } if (state === "test_center") {
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
    this.testRunner.runSuite(suite, cb);
  };
};


// Exports
// --------

ApplicationController.prototype = new ApplicationController.Prototype();
_.extend(ApplicationController.prototype, util.Events);

Application.Controller = ApplicationController;
Substance.Application = Application;

})(this);
