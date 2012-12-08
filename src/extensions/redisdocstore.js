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

  var documentId = function(id) {
    return "document:"+id;
  }

  /**
   *  Checks if a document exists
   *  @param id the document's id
   *  @param cb callback
   */
  this.exists = function (id, cb) {
    var result = self.redis.exists(documentId(id));

    if(typeof cb !== "undefined")
      cb({err: 0, result: result});

    return result;
  };

  /**
   * Creates a new document with the provided id
   * @param cb callback
   */
  this.create = function (id, cb) {

    if(self.exists(documentId(id), cb) && typeof cb !== "undefined") {
      cb({err: -1, msg: "Document already exists."});
    }

    // TODO: more initial fields?
    // initial id field
    self.redis.set(id, {"id": id});
    // TODO create initial list for commits

    if (typeof cb !== "undefined")
      cb({err: 0});

    return true;
  };

  /**
   *  Deletes a document
   *  @param cb callback
   */
  this.delete = function (id, cb) {
    self.redis.remove(documentId(id));

    if (arguments.length == 2)
      cb({err: 0});

    return true;
  }

  /**
   *  Stores a sequence of commits for a given document id.
   *
   *  @param newCommits an array of commit objects
   *  @param cb callback
   */
  this.update = function(id, newCommits, cb) {
    var commitsKey = documentId(id) + ":commits";
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

    if (typeof cb !== "undefined")
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

    var doc_id = documentId(id);

    if(!self.exists(id) && typeof cb !== "undefined") {
      cb({err: -1, msg: "Document does not exist.", doc: undefined});
      return undefined;
    }

    var doc = self.redis.getJSON(doc_id);
    doc.commits = {};

    var commits = self.redis.asList(doc_id + ":commits");
    var shas = commits.asArray();
    for (var idx=0; idx<shas.length; ++idx) {
      var commit = self.redis.getJSON( doc_id + ":commits:" + shas[idx]);
      doc.commits[shas[idx]] = commit;
    }

    if(!self.exists(id, cb) && typeof cb !== "undefined")
      cb({err: 0, doc: doc});

    return doc;
  };
};

//}
