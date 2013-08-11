"use strict";

var Backbone = require("../lib/backbone");

var Router = Backbone.Router.extend({
  initialize: function(options) {
    this.controller = options.controller;

    // Using this.route, because order matters
    this.route(':document', 'document', this.editor);
    this.route('documents/:document', 'document', this.editor);

    // this.route('new', 'new_document', this.newDocument);
    this.route('tests', 'test_center', this.testCenter);
    this.route('tests/:suite', 'test_center', this.testCenter);

    this.route('', 'start', this.library);
  },

  // Test Center
  // --------
  //

  testCenter: function(suite) {
    this.dispatch('open:test_center', [suite]);
  },

  // Editor View
  // --------
  //

  library: function() {
    console.log('opening the library');
    this.dispatch('open:library', [document]);
  },


  // Editor View
  // --------
  //

  editor: function(document) {
    console.log('opening doc...', document);
    this.dispatch('open:editor', [document]);
  },


  // Create a new document
  // --------
  //

  newDocument: function() {
    this.dispatch('create:document');
  },

  // Dispatch all routes to the controller's event system
  // --------
  //
  // We normalize all messages in our app and thus
  // hand it over to the session event system

  dispatch: function(message, args) {
    args = [message].concat(args || []);
    this.controller.trigger.apply(this.controller, args);
  }

});

module.exports = Router;
