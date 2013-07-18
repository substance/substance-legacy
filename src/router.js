var Router = Backbone.Router.extend({
  initialize: function(options) {
    this.controller = options.controller;

    // Using this.route, because order matters
    this.route(':document', 'document', this.editor);
    this.route('documents/:document', 'document', this.editor);

    // this.route('new', 'new_document', this.newDocument);

    this.route('tests', 'test_center', this.testCenter);
    this.route('tests/:suite', 'test_center', this.testCenter);

    this.route('', 'start', this.editor);
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

  editor: function(document) {
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
    var args = [message].concat(args || []);
    this.controller.trigger.apply(this.controller, args);
  }

});