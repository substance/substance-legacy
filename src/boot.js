$(function() {

  var Router = Backbone.Router.extend({
    initialize: function() {
      // Using this.route, because order matters
      this.route(':document', 'loadDocument', this.loadDocument);
      this.route('demo/:document', 'loadDocument', this.loadDocument);
      this.route('documents/:document', 'loadDocument', this.loadDocument);
      this.route('new', 'newDocument', this.newDocument);
      this.route('dashboard', 'dashboard', app.dashboard);
      this.route('', 'start', app.dashboard);
    },

    newDocument: function() {
      app.newDocument();
    },

    loadDocument: function(id) {
      app.document(id);
    }
  });

  // Welcome screen
  // ---------------

  var Start = Backbone.View.extend({
    id: 'container',
    render: function() {
      this.$el.html(_.tpl('start'));
      return this;
    }
  });

  // Welcome screen
  // ---------------

  var Dashboard = Backbone.View.extend({
    id: 'container',
    render: function() {
      var that = this;

      listDocuments(function(err, documents) {
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
      'submit #user_login_form': '_login',
      'click .logout': '_logout',
      'click #container': '_clear'
    },

    _clear: function(e) {
      if (_.include(['container', 'tools', 'composer'], e.target.id) && this.view.composer) this.view.composer.clear();
    },

    _login: function() {
      var that = this,
          options = {
            username: $('#login_username').val(),  
            password: $('#login_password').val()
          };

      authenticate(options, function(err) {
        that.user = options.username;
        localStorage.setItem('user', that.user);
        that.render();
      });
      return false;
    },

    _logout: function() {
      this.user = null;
      localStorage.removeItem('user');
      this.render();
      return false;
    },

    initialize: function(options) {
      var that = this;
      _.bindAll(this, 'document', 'dashboard');
      this.user = localStorage.getItem('user');
      if (!this.user) this.user = "guest";
    },

    // Toggle document view
    document: function(id) {
      var that = this;
      loadDocument(id, function(err, session) {
        // Shortcuts
        window.doc = session.document;
        window.session = session;

        that.view = new sc.views.Editor({model: session });
        that.render();
        that.listenForDocumentChanges();
        // router.navigate(id, false);
      });
    },

    // TODO: find a better way
    listenForDocumentChanges: function() {
      var that = this;
      var doc = this.view.model.document;

      doc.on('commit:applied', function(commit) {

        // Update publish state
        that.view.updatePublishState();

        if (commit.op[0] === "set") {
          var title = doc.content.properties.title;
          that.$('.menu .document').html(title);
        }
      });
    },

    newDocument: function() {
      var that = this;
      createDocument(function(err, session) {
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
      this.view = new Dashboard();
      this.render();
      // this.updateMenu();
      return;
    },

    // Render application template
    render: function() {
      var document = null;
      if (this.view instanceof sc.views.Editor) {
        var document = this.view.model.document.content.properties;
      }

      this.$el.html(_.tpl('substance', {
        user: this.user,
        document: document
      }));

      if (this.view) {
        this.$('#container').replaceWith(this.view.render().el);
      }
    }
  });
  
  Substance.settings = {
    hub: "https://substance-hub.herokuapp.com/api/v1"
  };

  // Start the engines
  window.app = new Application({el: 'body'});
  window.router = new Router({});
  Backbone.history.start();
});