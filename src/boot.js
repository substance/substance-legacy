$(function() {

  // Holds all available configurations
  Substance.configurations = {};

  // Load config from config.json
  function loadConfigurations(cb) {
    var file = Substance.client_type === "browser" ? '/config.json' : 'config.json';
    $.getJSON(file, function(data) {
      Substance.configurations = data;
      cb(null, data);
    })
    .error(function() {
      cb('not_found: using defaults'); 
    });
  }

  Substance.config = function() {
    var env = appSettings.getItem('env');
    return Substance.configurations[env];
  };

  loadConfigurations(function(err, configs) {
    Substance.configurations = configs;
    delete Substance.configurations.env;
    
    // Initially set env based on config value
    if (!appSettings.getItem('env')) {
      appSettings.setItem('env', config.env || 'development');
    }

    initSession(appSettings.getItem('env'));

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
