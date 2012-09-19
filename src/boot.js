$(function() {

  var Choreographer = Dance.Choreographer.extend({
    initialize: function() {
      // Using this.route, because order matters
      this.route(':document', 'loadDocument', this.loadDocument);
      this.route('new', 'newDocument', this.newDocument);
      this.route('', 'start', app.start);
    },

    newDocument: function() {
      app.document(Math.uuid());
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


  // The Mothership
  // ---------------

  var Application = Dance.Performer.extend({
    events: {
      'submit #user_login_form': '_login',
      'click .logout': '_logout'
    },

    _login: function() {
      var that = this,
          options = {
            username: $('#login_username').val(),  
            password: $('#login_password').val()
          };

      authenticate(options, function(err) {
        that.username = options.username;
        localStorage.setItem('username', that.username);
        that.render();
      });
      return false;
    },

    _logout: function() {
      this.username = null;
      localStorage.removeItem('username');
      this.render();
      return false;
    },

    initialize: function (options) {
      _.bindAll(this, 'start', 'document');
      this.username = localStorage.getItem('username');
    },

    // Toggle document view
    document: function(id) {
      var that = this;
      loadDocument(id, function(err, session) {

        // Init with a demo document
        that.view = new sc.views.Editor({el: '#container', model: session });
        that.view.render();
        choreographer.navigate(id, false);
      });
    },

    // Toggle Start view
    start: function() {
      this.view = new Start({el: '#container'});
      this.view.render();
    },

    // Render application template
    render: function() {
      this.$el.html(_.tpl('substance', {username: this.username}));
      if (this.view) {
        this.$('#container').replaceWith(this.view.el);
      }
    }
  });

  // TODO: Once we talk
  // talk.ready(function() {

  window.app = new Application({el: 'body'});

  app.render();

  // Start responding to routes
  window.choreographer = new Choreographer({});

  Dance.performance.start();
  // });
});