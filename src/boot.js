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
    initialize: function (options) {

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
      console.log('start view');
      this.view = new Start({el: '#container'});
      this.view.render();
    }
  });

  // TODO: Once we talk
  talk.ready(function() {
    console.log('Connected to the backend. Composer started');

    window.app = new Application();

    // Start responding to routes
    window.choreographer = new Choreographer({});

    Dance.performance.start();
  });
});