$(function() {

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

  // Login screen
  // ---------------

  var Login = Backbone.View.extend({
    id: 'container',
    render: function() {
      this.$el.html(_.tpl('login'));
      return this;
    }
  });

  // Signup screen
  // ---------------

  var Signup = Backbone.View.extend({
    id: 'container',
    render: function() {
      this.$el.html(_.tpl('signup'));
      return this;
    }
  });

  // Welcome screen
  // ---------------

  var Dashboard = Backbone.View.extend({
    id: 'container',
    events: {
      'click .delete-document': '_deleteDocument',
    },

    _deleteDocument: function(e) {
      var that = this;
      var docId = $(e.currentTarget).attr('data-id');

      session.deleteDocument(docId, function(err) {
        if (!err) that.render();
      });

      return false;
    },
    
    render: function() {
      var that = this;

      session.listDocuments(function(err, documents) {
        that.$el.html(_.tpl('dashboard', {
          documents: documents
        }));
      });
      return this;
    }
  });

  // The Mothership
  // ---------------

  var Application = Backbone.View.extend({
    events: {
      'submit #login_form': '_login',
      'submit #signup_form': '_signup',
      'click .logout': '_logout',
      'click #container': '_clear',
      'click #header .sync': '_sync',
      'click .toggle-user-actions': '_toggleUserActions',
      'click .toggle-environments': '_toggleEnvironments',
      'click a.load-environment': '_loadEnvironment',
      'click .user-actions': '_hideUserActions'
    },

    _toggleUserActions: function() {
      $('.user-actions').toggle();
      return false;
    },

    _hideUserActions: function() {
      $('.user-actions').hide();
    },

    _toggleEnvironments: function() {
      $('#header .environments').toggle();
      return false;
    },

    _loadEnvironment: function(e) {
      var env = $(e.currentTarget).attr('data-env');

      initSession(env);
      appSettings.setItem('env', env);
      this.dashboard();
    },

    _clear: function(e) {
      if (_.include(['container', 'tools', 'composer'], e.target.id) && this.view.composer) this.view.composer.clear();
    },

    // Synchronizing
    _sync: function() {
      var that = this;
      var replicator = new Substance.Replicator({
        localStore: session.localStore,
        remoteStore: session.remoteStore,
        user: session.user()
      });

      this.$('#header .sync').removeClass('disabled').addClass('active');
      replicator.sync(function(err) {
        console.log('Replication ERROR?', err);
        that.$('#header .sync').removeClass('active');
        that.$('#header .sync').addClass('disabled');

        // Document active, reload document, just to be safe
        if (that.view instanceof sc.views.Editor) {
          // TODO: remove that hack (relying on global doc.id)
          that.document(doc.id);
        } else {
          // View Dashboard by default
          that.dashboard();
        }
      });

      return false;
    },

    _login: function() {
      var that = this,
          username = $('#login_username').val(),
          password = $('#login_password').val();

      session.authenticate(username, password, function(err, data) {
        if (err) {
          that.$('#login .error-message').html(err);
          return;
        }

        that.user = username;

        that.dashboard();
      });
      return false;
    },

    _signup: function() {
      var that = this,
          user = {
            name: $('#signup_name').val(),
            username: $('#signup_username').val(),
            email: $('#signup_email').val(),
            password: $('#signup_password').val()
          };

      session.createUser(user, function(err, data) {
        if (err) {
          that.$('#login .error-message').html(err);
          return;
        }

        that.user = user.username;

        that.dashboard();
      });

      return false;
    },

    _logout: function() {
      session.logout();
      this.render();

      // Show login screen
      this.login();
      return false;
    },

    initialize: function(options) {
      var that = this;
      _.bindAll(this, 'document', 'dashboard', 'login', 'signup', 'console', 'testsuite');
    },

    // Toggle document view
    document: function(id) {
      var that = this;
      session.loadDocument(id, function(err, doc) {
        // Shortcuts
        window.doc = session.document;

        that.view = new sc.views.Editor({model: session });
        that.render();
        that.listenForDocumentChanges();
      });
    },

    // Toggle document view
    console: function(id) {
      var that = this;

      session.loadDocument(id, function(err, doc) {
        // Shortcuts
        window.doc = session.document;

        that.view = new sc.views.Console({model: session });
        that.render();
      });
    },

    testsuite: function(test) {
      this.view = new sc.views.Testsuite();
      this.render();

      if (test) {
        this.view.runTest(test);
      }
      return;
    },

    // TODO: find a better way
    listenForDocumentChanges: function() {
      var that = this;
      var doc = this.view.model.document;

      doc.on('commit:applied', function(commit) {
        // Update publish state
        that.view.updatePublishState();
        if (commit.op[0] === "set") {
          var title = doc.properties.title;
          that.$('.menu .document').html(title);
        }
      });
    },

    newDocument: function() {
      var that = this;
      session.createDocument(function(err, doc) {
        that.view = new sc.views.Editor({model: session });
        that.render();
        router.navigate('documents/'+session.document.id, false);

        // Shortcuts
        window.doc = session.document;
        window.session = session;

        // Add title / abstract
        _.delay(function() {
          session.document.apply(["set", {title: "Untitled", abstract: "Enter abstract"}]);
          that.listenForDocumentChanges();
        }, 100);
      });
      return;
    },

    dashboard: function() {
      if (!session.user()) return this.login();
      this.view = new Dashboard();
      this.render();
      router.navigate('/');
      return;
    },

    login: function() {
      this.view = new Login();
      this.render();
    },

    signup: function() {
      this.view = new Signup();
      this.render();
    },

    // Render application template
    render: function() {
      var document = null;
      if (this.view instanceof sc.views.Editor) {
        var document = this.view.model.document.properties;
      }

      this.$el.html(_.tpl('substance', {
        user: session.user(),
        document: document
      }));

      if (this.view) {
        this.$('#container').replaceWith(this.view.render().el);
      }
    }
  });
  
  Substance.settings = {
    hub: "http://substance.io",
    hub_api: "https://substance.io/api/v1",
    client_id: "f7043dc691102f3ac3175e606af2c8cb",
    client_secret: "ca85e9a193c721e5d65eba26164c0d87"
  };

  // Load config from config.json

  function loadConfig(cb) {
    $.getJSON('config.json', function(data) {
      _.extend(Substance.settings, data);
      cb(null, data);
    })
    .error(function() { cb('not_found: using defaults'); });
  }

  loadConfig(function(err, config) {    
    initSession(appSettings.getItem('env') || config.env);

    // Start the engines
    window.app = new Application({el: 'body'});
    window.router = new Router({});
    Backbone.history.start();

    // Trigger sync with hub
    key('ctrl+alt+s', _.bind(function() {
      app._sync();
      return false;
    }, this));
  });
});
