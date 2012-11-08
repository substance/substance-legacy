$(function() {

  var Choreographer = Dance.Choreographer.extend({
    initialize: function() {
      // Using this.route, because order matters
      this.route(':document', 'loadDocument', this.loadDocument);
      this.route('demo/:document', 'loadDocument', this.loadDocument);
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

  var Start = Dance.Performer.extend({
    id: 'container',
    render: function() {
      this.$el.html(_.tpl('start'));
      return this;
    }
  });


  // Welcome screen
  // ---------------

  var Dashboard = Dance.Performer.extend({
    id: 'container',
    render: function() {
      this.$el.html(_.tpl('dashboard', {
        documents: [
          { title: "Substance", author: "michael", file: "default_document" },
          { title: "Hello World", author: "michael", file: "hello_document" }
        ]
      }));
      return this;
    }
  });

  // The Mothership
  // ---------------

  var Application = Dance.Performer.extend({
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

    initialize: function (options) {
      _.bindAll(this, 'document', 'dashboard');
      this.user = localStorage.getItem('user');    
    },

    // Toggle document view
    document: function(id) {
      var that = this;
      loadDocument(id, function(err, session) {
        that.view = new sc.views.Editor({model: session });
        that.render();
        that.listenForDocumentChanges();
        // choreographer.navigate(id, false);
      });
    },

    // TODO: find a better way
    listenForDocumentChanges: function() {
      var that = this;
      this.view.model.document.on('operation:applied', function(op) {
        if (op[0] === "set") {
          var title = that.view.model.document.content.properties.title;
          that.$('.menu .document').html(title);
        }
      });
    },

    newDocument: function() {
      var that = this;
      createDocument(function(err, session) {
        that.view = new sc.views.Editor({model: session });
        that.render();
        that.listenForDocumentChanges();
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
  
  // Start the engines
  window.app = new Application({el: 'body'});
  // app.render();
  window.choreographer = new Choreographer({});
  Dance.performance.start();
});