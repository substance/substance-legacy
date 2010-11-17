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
    
    window.socket = new io.Socket(null, {
      port: 3003,
      transports: ['websocket']
    });
    
    socket.connect();
    socket.on('connect', function() {
      
    });
    
    socket.on('message', function(msg) {
      if (msg.type === 'change:node') {
        delete msg.body.node.children;
        delete msg.body.node.type;
        app.model.updateNode(msg.body.key, msg.body.node);        
      } else if (msg.type === 'new:collaborator') {
        notifier.notify(Notifications.NEW_COLLABORATOR);
      } else if (msg.type === 'exit:collaborator') {
        notifier.notify(Notifications.EXIT_COLLABORATOR);
      }
    });
    
    socket.on('disconnect', function(){ }); 
  });
})();
