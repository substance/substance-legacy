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

    initialize: function(options) {
      var that = this;
      _.bindAll(this, 'document', 'dashboard', 'login', 'signup', 'console', 'testsuite', 'replicationStart', 'replicationFinish');

      session.on('replication:started', this.replicationStart);
      session.on('replication:finished', this.replicationFinish);
    },

    replicationStart: function() {
      this.$('#header .sync').addClass('active').addClass('disabled');
    },

    replicationFinish: function(err) {
      var that = this;

      // UI update
      _.delay(function() {
        that.$('#header .sync').removeClass('active');
        // Update status
        if (err) this.$('#header .sync').removeClass('disabled').addClass('error');

        // HACK: only re-render after sync when on dashboard
        if (that.view instanceof Dashboard) {
          console.log(that.view);
          that.render();
        }
      }, 500);

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
      appSettings.setItem('env', env);
      initSession(env);
      this.dashboard();
    },

    _clear: function(e) {
      if (_.include(['container', 'tools', 'composer'], e.target.id) && this.view.composer) this.view.composer.clear();
    },

    // Synchronizing
    _sync: function() {
      var that = this;

      session.replicate();
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


    // Toggle document view
    document: function(id) {
      var that = this;
      session.loadDocument(id);
      // Shortcuts
      window.doc = session.document;
      that.view = new sc.views.Editor({model: session});
      that.render();
      that.listenForDocumentChanges();
    },

    // Toggle document view
    console: function(id) {
      var that = this;

      session.loadDocument(id);
      // Shortcuts
      window.doc = session.document;

      that.view = new sc.views.Console({model: session});
      that.render();
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

    // Create and edit a new document
    // ---------------

    newDocument: function() {
      session.createDocument();
      this.view = new sc.views.Editor({model: session });
      this.render();
      router.navigate('documents/'+session.document.id, false);

      // Shortcuts
      window.doc = session.document;
      window.session = session;

      this.listenForDocumentChanges();
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
        document = this.view.model.document.properties;
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