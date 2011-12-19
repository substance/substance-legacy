// The Application
// ---------------

// This is the top-level piece of UI.
s.views.Application = Backbone.View.extend({

  events: {
    'click .toggle-view': 'toggleView'
  },

  toggleView: function (e) {
    router.navigate($(e.currentTarget).attr('href').slice(1), true);
    return false;
  },
  
  initialize: function () {
    _.bindAll(this, 'home', 'explore', 'dashboard', 'search', 'user', 'newDocument', 'loadDocument', 'register');
    var that = this;
    
    // Initialize document
    this.header = new s.views.Header({el: '#header', app: this});
    
    // Cookie-based auto-authentication
    if (session.username) {
      graph.merge(session.seed);
      this.username = session.username;
    }
    
    that.render(); // TODO
  },

  replaceMainView: function (view) {
    if (this.mainView) {
      this.mainView.remove();
    }
    this.mainView = view;
    $(view.el).appendTo(this.$('#main'));
  },

  explore: function () {
    loadExplore(_.bind(function (err, res) {
      this.replaceMainView(new s.views.Explore({ model: res }).render());
    }, this));
  },

  search: function (queryString) {
    search(queryString, _.bind(function (err, res) {
      this.replaceMainView(new s.views.Search({ model: res }).render());
    }, this));
  },

  home: function () {
    this.replaceMainView(new s.views.Home({}).render());
  },

  user: function(username) {
    var that = this;
    loadDocuments({"type": "user", "value": username}, function (err, data) {
      that.replaceMainView(new s.views.UserProfile({ model: data }).render());
    });
  },

  dashboard: function() {
    var that = this;
    loadDocuments({"type": "user", "value": session.username}, function (err, data) {
      that.replaceMainView(new s.views.Dashboard({ model: data }).render());
    });
  },

  // Confirm invitation
  collaborate: function(tan) {
    this.replaceMainView(new s.views.ConfirmCollaboration({ tan: tan }).render());
  },

  recoverPassword: function() {
    this.replaceMainView(new s.views.RecoverPassword({}));
  },

  resetPassword: function(username, tan) {
    this.replaceMainView(new s.views.ResetPassword({ username: username, tan: tan }));
  },

  newDocument: function () {
    if (!head.browser.webkit && !head.browser.mozilla) {
      alert("You need to use a Webkit based browser (Google Chrome, Safari) in order to write documents. In future, other browers will be supported too.");
      return false;
    }
    this.replaceMainView(new s.views.NewDocument({}).render());
  },

  register: function () {
    this.replaceMainView(new s.views.Signup({}).render());
  },

  loadDocument: function (username, docname, version, nodeid, commentid, mode) {
    loadDocument(username, docname, version, nodeid, commentid, mode, _.bind(function (err, doc) {
      // TODO: scroll to desired part of the document
      // TODO: error handling

      this.replaceMainView(new s.views.Document({model: doc}).render());
    }, this));
  },

  scrollTo: function(id) {
    var offset = $('#'+id).offset();
    offset ? $('html, body').animate({scrollTop: offset.top}, 'slow') : null;
    return false;
  },

  // Application Setup
  // -------------
  
  query: function() {
    return loggedIn() ? { "type": "user", "value": this.username }
                      : { "type": "user", "value": "demo" }
  },

  // Should be rendered just once
  render: function() {
    this.header.render();
    return this;
  }
});
