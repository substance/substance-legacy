Substance.settings = {
  hub: "http://substance.io",
  hub_api: "https://substance.io/api/v1",
  client_id: "f7043dc691102f3ac3175e606af2c8cb",
  client_secret: "ca85e9a193c721e5d65eba26164c0d87"
};

// Load config from config.json

function loadConfig(cb) {
  $.getJSON('../config.json', function(data) {
    _.extend(Substance.settings, data);
    cb(null);
  })
  .error(function() { cb('not_found: using defaults'); });
}

loadConfig(function(err, config) {
  initSession();
});