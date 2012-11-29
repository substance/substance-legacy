// check if redis acces is available

//if (redis === "undefined") {
//  return;
//}

/* BEGIN: mock for RedisAccess */
var redis = {};

redis.MockRedisAccess = function () {
  this.setHost = function (url) {};
  this.setPort = function (port) {};
  this.setScope = function (scope) {};
  this.connect = function () {};
  this.exists = function (id) { return false; };
  this.get = function (id) { return '{"id": "' + id +'" }'; };
  this.set = function (id, val) {};
  this.delete = function (id) {};
  this.asList = function(id) { return new redis.MockRedisList(id); };
  this.beginTransaction = function() {};
  this.executeTransaction = function() { return ["1", "2"]; };
  this.cancelTransaction = function () {};
};

redis.MockRedisList = function () {
  this.size = function () {return 0;};
  this.getLast = function () { return "undefined"; };
  this.add = function (val) {return 0;};
  this.asArray = function () { return [{sha: "1", parent: "undefined"}, {sha: "2", parent: "1"}]};
}

var mock_cb = function(result) {
  if (result.err != 0) {
    print("Error occurred: " + result.msg);
  } else if (typeof result.result != "undefined") {
    print("Received result: " + JSON.stringify(result.result));
  }
};

/* END: mock for RedisAccess */

var RedisDocStore = function (settings) {

  // reference to this for use within instance methods
  var self = this;

  this.redis = new redis.MockRedisAccess();

  // default settings for redis db
  var host = "127.0.0.1";
  var port = 6379;
  var scope = "substance";

  // use the settings object to override the default settings
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

  // the scope is useful to keep parts of the redis db separated
  // e.g. tests would use its own, or one could separate user spaces
  this.redis.setScope(scope);

  // Checks if a document exists
  // id: the document's id
  // cb: 1-arg-callback with fields
  //    result: true if exists
  this.exists = function (id, cb) {
    var result = self.redis.exists(id);
    cb({err: 0, result: result});
  };

  // Creates a new document with the provided id
  // cb: 1-arg-callback with fields
  //    err: -1 if already exists;
  //          0 else
  //    msg: error message
  this.create = function (id, cb) {

    if(self.exists(id)) {
      cb({err: -1, msg: "Document already exists."});
    }

    // initial id field
    self.redis.set(id, "id", id);
    // TODO: more initial fields?

    cb({err: 0});
  };

  // Deletes a document
  // cb: 1-arg-callback with fields
  //    err: always 0
  this.delete = function (id, cb) {
    self.redis.remove(id);
    cb({err: 0});
  }

  // Stores a sequence of commits for a given document id.
  // newCommits: an array of commit objects
  // cb: 1-arg-callback with fields
  //    err: -1   if commit chain is invalid
  //          0   else
  //    msg: error message
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
      //       if something is wrong, e.g., invalid sha sequence, then the transaction is cancelled.
      commits.add(newCommits[idx].sha);

      // store the commit's data into an own field
      self.redis.set(id + ":commits:" + newCommits[idx].sha, newCommits[idx].toString());
      print("Setting data: id = " + newCommits[idx].sha + ", data = " + JSON.stringify(newCommits[idx]));

      lastSha = newCommits[idx].sha;
    }

    self.redis.executeTransaction();
    cb({err: 0});
  };

  // Retrieves a document
  // id: the document's id
  // cb: 1-arg-callback with fields
  //    err: -1   if document does not exist
  //          0   else
  //    msg: error message
  //    doc: a document object containing
  //    doc.commits: the documents commit array
  this.get = function(id, cb) {

    if(!self.exists(id)) {
      cb({err: -1, msg: "Document does not exist."});
      return;
    }

    var doc_data = self.redis.get(id);
    var doc = JSON.parse(doc_data);
    var commits = self.redis.asList(id + ":commits");
    doc.commits = commits.asArray();
    cb({err: 0, doc: doc});
  };
};


// From here sandbox

var mystore = new RedisDocStore();
print("Run exists()...");
mystore.exists("bla", mockCb);

print("Run create()...");
mystore.create("bla", mockCb);

print("Run delete()...");
mystore.delete("bla", mockCb);

print("Run update()...");
mystore.update("bla", [{sha: "1", parent: "undefined"}, {sha: "2", parent: "1"}], mockCb);

print("Run get()...");
mystore.get("bla", mockCb);
