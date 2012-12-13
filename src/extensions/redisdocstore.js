// check if the redis native extension is available
//if (typeof redis !== "undefined" || typeof redis.RedisAccess !== "undefined") {

redis.RedisDocStore = function (settings) {

  // reference to this for use within instance methods
  var self = this;

  this.redis = redis.RedisAccess.Create(0);

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

  /**
   *  Checks if a document exists
   *  @param id the document's id
   *  @param cb callback
   */
  this.exists = function (id, cb) {
    var result = self.redis.exists(id);
    if (cb) cb(result);
    return result;
  };

  /**
   * Creates a new document with the provided id
   * @param cb callback
   */
  this.create = function (id, cb) {
    if(self.exists(id) && cb) {
      return cb({err: -1, msg: "Document already exists."});
    }

    var doc = {"id": id};

    // TODO: more initial fields?
    // initial id field
    // TODO: what to do if this fails?
    self.redis.set(id, doc);

    // TODO create initial list for commits
    if (cb) cb(null, doc);

    return doc;
  };

  /**
   *  Deletes a document
   *  @param cb callback
   */
  this.delete = function (id, cb) {
    self.redis.remove(id);
    if (cb) cb(null);
    return true;
  }

  /**
   *  Stores a sequence of commits for a given document id.
   *
   *  @param newCommits an array of commit objects
   *  @param cb callback
   */
  this.update = function(id, newCommits, cb) {
    var commitsKey = id + ":commits";
    var commits = self.redis.asList(commitsKey);

    var lastSha = undefined;
    if(commits.size() > 0)
      lastSha = commits.get();

    self.redis.beginTransaction();
    for(var idx=0; idx<newCommits.length; idx++) {

      // commit must be in proper order
      if (typeof lastSha !== undefined && newCommits[idx].parent != lastSha) {
        self.redis.cancelTransaction();
        var err = {err: -1, msg: "Invalid commit chain."};
        // TODO: maybe give more details about the problem
        if (typeof cb !== "undefined")
          cb(err);
        else
          console.log(err.msg);
        return false;
      }

      // note: these commands will be executed when executeTransaction is called
      //       if something is wrong, e.g., invalid sha sequence, then the transaction is cancelled.
      commits.add(newCommits[idx].sha);

      // store the commit's data into an own field
      self.redis.set(commitsKey + ":" + newCommits[idx].sha, newCommits[idx]);

      lastSha = newCommits[idx].sha;
    }

    self.redis.executeTransaction();

    if(arguments.length == 3)
      cb({err: 0});
    else
      return true;
  };

  /**
   * Retrieves a document
   *
   * @param id the document's id
   * @param cb callback
   */
  this.get = function(id, cb) {

    if(!self.exists(id) && typeof cb !== "undefined") {
      if(arguments.length == 2) {
        cb({err: -1, msg: "Document does not exist."}, undefined);
      } else {
        throw new RedisError("Document does not exist.")
      }
    }

    var doc = self.redis.getJSON(id);
    doc.commits = {};

    var commits = self.redis.asList(id + ":commits");
    var shas = commits.asArray();
    for (var idx=0; idx<shas.length; ++idx) {
      var commit = self.redis.getJSON( id + ":commits:" + shas[idx]);
      doc.commits[shas[idx]] = commit;
    }

    // TODO: more about that refs
    var lastSha;
    if(shas.length > 0) {
      lastSha = commits.get();
    } else {
      lastSha = undefined;
    }
    doc.refs = {
      master: lastSha
    }

    if(arguments.length == 2)
      cb(0, doc);

    return doc;
  };
};

var redisstore = new redis.RedisDocStore();

//}
