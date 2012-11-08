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
    render: function() {
      this.$el.html(_.tpl('start'));
    }
  });


  // Welcome screen
  // ---------------

  var Dashboard = Dance.Performer.extend({
    render: function() {
      this.$el.html(_.tpl('dashboard', {
        documents: [
          { title: "Substance", author: "michael", file: "default_document" },
          { title: "Hello World", author: "michael", file: "hello_document" }
        ]
      }));
    }
  });

  // The Mothership
  // ---------------

  var Application = Dance.Performer.extend({
    events: {
      'submit #user_login_form': '_login',
      'click .logout': '_logout',
      'click .dashboard': 'dashboard',
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
        that.view = new sc.views.Editor({el: '#container', model: session });
        that.view.render();
        // choreographer.navigate(id, false);
      });
    },

    newDocument: function() {
      var that = this;
      createDocument(function(err, session) {
        console.log(' a new doccc', session);
        that.view = new sc.views.Editor({el: '#container', model: session });
        that.view.render();
      });
      
      return;
    },

    // Toggle Start view
    // start: function() {
    //   this.view = new Start({el: '#container'});
    //   this.view.render();
    // },

    dashboard: function() {
      console.log('rendering dashboard.')
      this.view = new Dashboard({el: '#container'});
      this.view.render();
      return;
    },

    // Render application template
    render: function() {
      this.$el.html(_.tpl('substance', {user: this.user}));
      if (this.view) {
        this.$('#container').replaceWith(this.view.el);
      }
    }
  });
  
  // Start the engines
  window.app = new Application({el: 'body'});
  app.render();
  window.choreographer = new Choreographer({});
  Dance.performance.start();

});