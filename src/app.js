// DocumentComposer - Data-driven content authoring
(function() {
  $(function() {
    // set up a notifier for status-message communication
    window.notifier = new Backbone.Notifier();
    
    // Start the engines
    var app = new DocumentComposer({el: $('#container')});
    
    // Initial rendering
    app.render();
    app.newDocument();
    
    // Initialize controllers
    new ApplicationController({app: app});
    Backbone.history.start();
    
  });
})();
