var ApplicationController = Backbone.Controller.extend({
  routes: {
    'load/:document': 'loadDocument'
  },

  initialize: function() {
    // this.app = options.app;
  },

  loadDocument: function(document) {
    app.loadDocument(document);
  }
});