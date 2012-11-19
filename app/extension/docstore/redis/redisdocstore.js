// check if redis acces is available

//if (redis === "undefined") {
//  return;
//}

/* mock for RedisAccess */
var redis = {};

redis.RedisAccess = function () {
  this.setHost = function (url) {};
  this.setPort = function (port) {};
  this.setScope = function (scope) {};
  this.connect = function () {};
  this.exists = function (id) { return false; };
  this.get = function (id) { return '{"id": "' + id +'" }'; };
  this.set = function (id, val) {};
  this.delete = function (id) {};
  this.asList = function(id) { return new redis.RedisList(id); };
  this.beginTransaction = function() {};
  this.executeTransaction = function() { return ["1", "2"]; };
  this.cancelTransaction = function () {};
};

redis.RedisList = function () {
  this.size = function () {return 0;};
  this.getLast = function () { return "undefined"; };
  this.add = function (val) {return 0;};
  this.asArray = function () { return [{sha: "1", parent: "undefined"}, {sha: "2", parent: "1"}]};
}

// static factory method
// Note: this way it would be possible to switch to another implementation later (if necessary)
redis.RedisAccess.Create = function (hint) {
  return new redis.RedisAccess();
}

var RedisDocStore = function (settings) {

  // reference to this for use within instance methods
  var self = this;

  this.redis = redis.RedisAccess.Create();

  var host = "127.0.0.1";
  var port = 6379;
  var scope = "substance";
  
  if (arguments.length == 1) {
    if (typeof settings.host != "undefined") {
      host = settings.host;
    }
    if (typeof settings.port != "undefined") {
      port = settings.port;
    }
    if (typeof settings.scope != "undefined") {
      scope = settings.scope;
    }
  }
  
  this.redis.setHost(host);
  this.redis.setPort(port);
  this.redis.connect();
  
  this.redis.setScope(scope);
  
  this.exists = function (id, cb) {
    var result = self.redis.exists(id);
    
    // support callback and without
    if(arguments.length == 2) {
      cb({err: 0, result: result});
    } else {
      return result;
    }
  };

  this.create = function (id, cb) {

    if(self.exists(id)) {
      cb({err: -1, msg: "Document already exists."});
    }
    
    // initial id field
    self.redis.set(id, "id", id)
    // TODO: more initial fields
  };

  this.delete = function (id, cb) {
    self.redis.remove(id);
    cb({err: 0});
  }

  this.update = function(id, newCommits, cb) {
    var commits = self.redis.asList(id + ":commits");

    var lastSha = commits.getLast();
    self.redis.beginTransaction();    
    for(var idx=0; idx<newCommits.length; idx++) {
      
      // commit must be in proper order
      if (newCommits[idx].parent != lastSha) {
        self.redis.cancelTransaction();
        // TODO: maybe give more details about the problem
        cb({err: -1, msg: "Invalid commit chain."});
        return;
      }

      // note: these commands will be executed when executeTransaction is called
      commits.add(newCommits[idx].sha);
      self.redis.set(id + ":commits:" + newCommits[idx].sha, newCommits[idx].toString());
      print("Setting data: id = " + newCommits[idx].sha + ", data = " + JSON.stringify(newCommits[idx]));
      lastSha = newCommits[idx].sha;
    }

    self.redis.executeTransaction();
    cb({err: 0});
  };
  
  this.get = function(id, cb) {
    var doc_data = self.redis.get(id);
    var doc = JSON.parse(doc_data);
    var commits = self.redis.asList(id + ":commits");
    doc.commits = commits.asArray();
    cb({err: 0, result: doc});
  };
};

var my_cb = function(result) {
  if (result.err != 0) {
    print("Error occurred: " + result.msg);
  } else if (typeof result.result != "undefined") {
    print("Received result: " + JSON.stringify(result.result));
  }
};

var mystore = new RedisDocStore();
print("Run exists()...");
mystore.exists("bla", my_cb);

print("Run create()...");
mystore.create("bla", my_cb);

print("Run delete()...");
mystore.delete("bla", my_cb);

print("Run update()...");
mystore.update("bla", [{sha: "1", parent: "undefined"}, {sha: "2", parent: "1"}], my_cb);

print("Run get()...");
mystore.get("bla", my_cb);
