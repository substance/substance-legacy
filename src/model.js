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
    console.log("WebAppSettings.setItem", key, value);
    localStorage.setItem(key, value);
  };

  this.toJSON = function() {
    var json = JSON.stringify(localStorage);
    console.log("WebAppSettings.toJSON", json);
    return json;
  };

  this.getItem = function(key) {
    console.log("WebAppSettings.getItem", key);
    return localStorage.getItem(key);
  };
};

if (typeof redis === 'undefined') {
  window.appSettings = new WebAppSettings();
} else {
  window.appSettings = new NativeAppSettings();
}

// Helpers
// -----------------

function synced(docId) {
  if (!session.remoteStore) return true;

  var refs = session.localStore.getRefs(docId);
  if (refs.master) {
    return refs.master.head === refs['master']['remote-head'];
  } else {
    return false;
  }
}

function published(doc) {
  return !!doc.meta.published_commit;
}


// Initialization
// -----------------

var session;

function initSession(env) {
  session = new Substance.Session({env: env});
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

