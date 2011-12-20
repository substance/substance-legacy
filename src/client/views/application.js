// The Application
// ---------------

// This is the top-level piece of UI.
s.views.Application = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click .toggle-view': 'toggleView'
  },

  toggleView: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var link  = $(e.currentTarget)
    ,   route = link.attr('href').replace(/^\//, '');
    
    $('.toggle-view.active').removeClass('active');
    link.addClass('active');
    
    router.navigate(route, true);
  },


  // Initialize
  // ----------

  initialize: function () {
    _.bindAll(this);
    
    // Initialize document
    this.header = new s.views.Header({});
    
    // Cookie-based auto-authentication
    if (session.username) {
      graph.merge(session.seed);
      this.username = session.username;
    }
  },

  // Should be rendered just once
  render: function () {
    $(this.header.render().el).prependTo(this.el);
    return this;
  },


  // Helpers
  // -------

  scrollTo: function (id) {
    var offset = $('#'+id).offset();
    offset ? $('html, body').animate({scrollTop: offset.top}, 'slow') : null;
    return false;
  },

  replaceMainView: function (view) {
    if (this.mainView) {
      this.mainView.remove();
    }
    this.mainView = view;
    $(view.el).appendTo(this.$('#main'));
  },


  // Main Views
  // ----------

  explore: function () {
    loadExplore(_.bind(function (err, res) {
      this.replaceMainView(new s.views.Explore({ model: res, id: 'explore' }).render());
    }, this));
  },

  network: function (network) {
    loadNetwork(network, _.bind(function (err, res) {
      this.replaceMainView(new s.views.Network({ model: res, id: 'network' }).render());
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
      that.replaceMainView(new s.views.Dashboard({ model: data, id: 'dashboard' }).render());
    });
  },

  // Confirm invitation
  collaborate: function(tan) {
    this.replaceMainView(new s.views.ConfirmCollaboration({ tan: tan }).render());
  },

  recoverPassword: function () {
    this.replaceMainView(new s.views.RecoverPassword({}).render());
  },

  resetPassword: function (username, tan) {
    this.replaceMainView(new s.views.ResetPassword({ username: username, tan: tan }).render());
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

  userSettings: function () {
    this.replaceMainView(new s.views.UserSettings({}).render());
  },

  loadDocument: function (username, docname, version, nodeid, commentid) {
    var render = _.bind(function (doc) {
      this.replaceMainView(new s.views.Document({ model: doc }).render());
    }, this);
    
    var id = '/document/'+username+'/'+docname;
    if (graph.get(id)) {
      render(graph.get(id));
    } else {
      loadDocument(username, docname, version, _.bind(function (err, res) {
        // TODO: scroll to desired part of the document
        // TODO: error handling
        render(res.doc);
      }, this));
    }
  }

});
