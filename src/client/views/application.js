// This is the top-level piece of UI.
s.views.Application = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click .toggle-view': 'toggleView',
    'click .toggle-startpage': 'home'
  },

  toggleView: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var link  = $(e.currentTarget),
        route = link.attr('href').replace(/^\//, '');
    
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
    offset ? $('html, body').animate({scrollTop: offset.top-90}, 'slow') : null;
    return false;
  },

  replaceMainView: function (name, view) {
    $('body').removeClass().addClass('current-view '+name);
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
      this.replaceMainView("explore", new s.views.Explore({ model: res, id: 'explore' }).render());
    }, this));
  },

  network: function (network) {
    loadNetwork(network, _.bind(function (err, res) {
      this.replaceMainView("network", new s.views.Network({ model: res, id: 'network' }).render());
    }, this));
  },

  search: function (queryString) {
    search(queryString, _.bind(function (err, res) {
      this.replaceMainView("search", new s.views.Search({ model: res, id: 'search'  }).render());
    }, this));
  },

  home: function () {
    router.navigate('');
    this.replaceMainView("home", new s.views.Home({id: 'home' }).render());
    return false;
  },

  user: function (username) {
    loadUserProfile(username, _.bind(function (err, data) {
      this.replaceMainView("user_profile", new s.views.UserProfile({ model: data, id: 'user_profile' }).render());
    }, this));
  },

  dashboard: function () {
    router.navigate('dashboard');
    loadDashboard({ type: 'user', value: session.username }, _.bind(function (err, data) {
      this.replaceMainView("dashboard", new s.views.Dashboard({ model: data, id: 'dashboard' }).render());
    }, this));
  },

  // Confirm invitation
  collaborate: function(tan) {
    loadCollaborationConfirmation(tan, _.bind(function(err, data) {
      this.replaceMainView("confirm_collaboration", new s.views.ConfirmCollaboration({ model: data, id: 'confirm_collaboration' }).render());
    }, this));
  },

  recoverPassword: function () {
    this.replaceMainView("recover_password", new s.views.RecoverPassword({id: 'recover_password'}).render());
  },

  resetPassword: function (username, tan) {
    this.replaceMainView("reset_password", new s.views.ResetPassword({ username: username, tan: tan, id: 'reset_password' }).render());
  },

  newDocument: function () {
    if (!head.browser.webkit && !head.browser.mozilla) {
      alert("You need to use a Webkit based browser (Google Chrome, Safari) in order to write documents. In future, other browers will be supported too.");
      return false;
    }
    this.replaceMainView("new_document", new s.views.NewDocument({id: 'new_document' }).render());
  },

  register: function () {
    this.replaceMainView("signup", new s.views.Signup({id: 'signup' }).render());
  },

  userSettings: function () {
    this.replaceMainView("user_settings", new s.views.UserSettings({id: 'user_settings' }).render());
  },

  "import": function () {
    this.replaceMainView("import", new s.views.Import({id: 'import' }).render());
  },

  loadDocument: function (username, docname, version, nodeid, commentid) {
    var render = _.bind(function (options) {
      this.replaceMainView("document", new s.views.Document(_.extend(options, {id: 'document_view' })).render());

      // TODO: move code to document view
      var bounds;
      var sections;

      // Calculate boundaries
      function calcBounds() {
        bounds = [];
        sections = [];
        $('#document .content-node.section').each(function() {
          bounds.push($(this).offset().top);
          sections.push(graph.get(this.id.replace(/_/g, '/')));
        });
      }

      function getActiveSection() {
        var active = 0;
        _.each(bounds, function(bound, index) {
          if ($(window).scrollTop() >= bound-90) {
            active = index;
          }
        });
        return active;
      }

      var prevSection = null;

      function updateToc(e) {
        var activeSection = getActiveSection();
        if (activeSection !== prevSection) {
          prevSection = activeSection;
          app.mainView.documentLens.selectedItem = activeSection;
          // TODO: no re-render required here
          app.mainView.documentLens.render();
        }
      }

      window.calcBounds = calcBounds;
      window.getActiveSection = getActiveSection;
      window.updateToc = updateToc;

      setTimeout(calcBounds, 400);
      $(window).scroll(updateToc);

    }, this);
    
    var id = '/document/'+username+'/'+docname;
    loadDocument(username, docname, version, _.bind(function (err, res) {
      if (err) return $('#main').html('<div class="notification error">'+err.message+'</div>');

      render({
        model: res.doc,
        authorized: res.authorized,
        version: res.version,
        published: res.published
      });

      if (commentid) {
        var node = app.mainView.node.nodes[nodeid.replace(/_/g, "/")];
        node.selectThis();
        node.comments.toggle();
      } else if (nodeid) {
        this.scrollTo(nodeid)
      }
    }, this));
  }

});
