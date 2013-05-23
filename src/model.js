// AppSettings
// -----------------
//
// Persistence for application settings

// TODO: switch between native and web-client version:
// web -> localstoreage, native->

// TODO: Make localStorage work
var NativeAppSettings = function(settings) {
  var dbSettings = {
    host: "127.0.0.1",
    port: 6379,
    scope: "substance:app-settings"
  };

  // override the default values if given
  dbSettings = _.extend(dbSettings, settings);

  this.db = redis.RedisAccess.Create(0);
  this.db.setHost(dbSettings.host);
  this.db.setPort(dbSettings.port);
  this.db.connect();
  this.db.setScope(dbSettings.scope);

  var hash = this.db.asHash("data");

  this.setItem = function(key, value) {
    hash.set(key, value);
  };

  this.toJSON = function() {
    var res = {};
    _.each(hash.getKeys(), function(key) {
      res[key] = this.get(key);
    }, this);
    return res;
  };

  this.getItem = function(key) {
    return hash.getJSON(key);
  };
};

var WebAppSettings = function(settings) {

  this.setItem = function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  };

  this.toJSON = function() {
    var json = JSON.stringify(localStorage);
    return json;
  };

  this.getItem = function(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (err) {
      console.log("Localstore contains illegal value.");
      return null;
    }
  };
};

if (Substance.client_type === "browser") {
  window.appSettings = new WebAppSettings();
} else {
  window.appSettings = new NativeAppSettings();
}

// Helpers
// -----------------

function published(doc) {
  return !!doc.meta.published_commit;
}

// Initialization
// -----------------

function initSession(env) {
  Substance.session = new Substance.Session({env: env});
}

// TODO: Find a better place
if (typeof Substance.test === 'undefined') Substance.test = {};

Substance.test.createDump = function() {
  // TODO: Iterate over all exisiting scopes
  var scopes = ["michael", "oliver", "admin"];
  var dump = {};

  _.each(scopes, function(scope) {
    var store = new Substance.RedisStore({scope: scope});
    dump[scope] = store.dump();
  });
  return dump;
}
