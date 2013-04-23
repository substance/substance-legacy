// AppSettings
// -----------------
//
// Persistence for application settings

// TODO: Make localStorage work
var AppSettings = function(settings) {
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

window.appSettings = new AppSettings();


// Helpers
// -----------------

function synced(docId) {
  return session.localStore.getRef(docId, 'master', 'head') === session.localStore.getRef(docId, 'remote:master', 'head');
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

