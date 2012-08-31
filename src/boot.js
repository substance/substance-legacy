var talk = new Talk.Client("ws://localhost:3100/");

$(function() {

  var Choreographer = Dance.Choreographer.extend({
    initialize: function() {
      // Using this.route, because order matters
      this.route(':document', 'loadDocument', this.loadDocument);
      this.route('new', 'newDocument', this.newDocument);
    },

    newDocument: function() {
      console.log('creating a new document..');
      app.composer = new Substance.Composer({el: '#container', model: createDocument() });
      app.composer.render();
    },

    loadDocument: function(id) {
      
    }
  });

  var Application = Dance.Performer.extend({
    initialize: function (options) {
      // Init with a demo document
      this.composer = new Substance.Composer({el: '#container', model: this.model });
      this.composer.render();
    }
  });


  // TODO: Once we talk
  talk.ready(function() {
    console.log('Connected to the backend. Composer started');

    createSession(function(err, session) {
      window.app = new Application({ model: session });

      // Start responding to routes
      var choreographer = new Choreographer({});

      Dance.performance.start();
    });
  });

});