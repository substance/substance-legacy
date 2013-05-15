var Router = Backbone.Router.extend({
  initialize: function() {
    // Using this.route, because order matters
    this.route(':document', 'loadDocument', this.loadDocument);
    this.route('demo/:document', 'loadDocument', this.loadDocument);
    this.route('documents/:document', 'loadDocument', this.loadDocument);
    this.route('tests', 'tests', app.testsuite);
    this.route('tests/:test', 'executeTest', app.testsuite);
    this.route('console/:document', 'tests', app.console);
    this.route('new', 'newDocument', this.newDocument);
    this.route('dashboard', 'dashboard', app.dashboard);
    this.route('', 'start', app.dashboard);
    this.route('login', 'login', app.login);
    this.route('logout', 'logout', app.login);
    this.route('signup', 'signup', app.signup);
  },

  newDocument: function() {
    app.newDocument();
  },

  loadDocument: function(id) {
    app.document(id);
  }
});