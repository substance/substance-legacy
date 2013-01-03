// check if the redis native extension is available
// if (typeof redis !== "undefined" || typeof redis.RedisAccess !== "undefined") {
if (window.redis) {

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

  self.documents = self.redis.asHash("documents");

  this.snapshotKey = function(id) {
    return id + ":snapshots"
  }

  /**
   *  Checks if a document exists
   *  @param id the document's id
   *  @param cb callback
   */

  this.exists = function (id, cb) {
    var result = self.documents.contains(id);
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

    // TODO: also store created_at
    var doc = {
      "id": id,
      "meta": {
        "created_at": new Date(),
        "updated_at": new Date()
      },
      "data": {}, // conforms to Substance.Document API
    };

    // TODO: more initial fields?
    // initial id field
    // TODO: what to do if this fails?
    
    self.documents.set(id, doc);

    // TODO create initial list for commits
    if (cb) cb(null, doc);

    return doc;
  };

  this.list = function (cb) {
    var docIds = self.documents.getKeys();
    var docs = [];

    for (var idx = 0; idx < docIds.length; ++idx) {
      var snapshotId = self.snapshotKey(docIds[idx]);
      var snapshots = self.redis.asHash(snapshotId);

      var doc = snapshots.getJSON("master") || {
        properties: {title: "Untitled", abstract: "Enter abstract" }
      };

      doc.id = docIds[idx];
      docs.push(doc);
    }
    if(cb) cb(null, docs);
    return docs;
  }

  /**
   *  Deletes a document
   *  @param cb callback
   */
  this.delete = function (id, cb) {
    self.documents.remove(id);
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

      var commit = newCommits[idx];

      // commit must be in proper order
      if (typeof lastSha !== undefined && commit.parent != lastSha) {
        self.redis.cancelTransaction();
        var err = {err: -1, msg: "Invalid commit chain."};
        // TODO: maybe give more details about the problem
        if (typeof cb !== "undefined")
          cb(err);
        else
          console.log(err.msg);
        return false;
      }

      lastSha = newCommits[idx].sha;
    }

    self.redis.executeTransaction();

    // save the commits after knowing that everything is fine
    for(var idx=0; idx<newCommits.length; idx++) {
      // note: these commands will be executed when executeTransaction is called
      //       if something is wrong, e.g., invalid sha sequence, then the transaction is cancelled.
      commits.add(newCommits[idx].sha);
      // store the commit's data into an own field
      self.redis.set(commitsKey + ":" + newCommits[idx].sha, newCommits[idx]);
    }

    if(arguments.length == 3)
      cb({err: 0});
    else
      return true;
  };

  this.setSnapshot = function (id, data, title, cb) {

    var snapshots = self.redis.asHash(self.snapshotKey(id));
    snapshots.set(title, data);

    if(cb) { cb(null); }
  }

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

    var doc = self.documents.getJSON(id);

    // TODO: remove this backward-compatibility hack
    if (!doc.data) doc.data = {};

    doc.data.commits = {};

    var commits = self.redis.asList(id + ":commits");
    var shas = commits.asArray();
    for (var idx=0; idx<shas.length; ++idx) {
      var commit = self.redis.getJSON( id + ":commits:" + shas[idx]);
      doc.data.commits[shas[idx]] = commit;
    }

    // TODO: more about that refs
    var lastSha;
    if(shas.length > 0) {
      lastSha = commits.get();
    } else {
      lastSha = undefined;
    }

    doc.data.refs = {
      master: lastSha
    };

    // TODO: retrieve metadata from database
    // var result = {
    //   data: doc.data,
    //   created_at: new Date(),
    //   published_at: new Date(),
    //   published_commit: "commit-25"
    // };

    if(arguments.length == 2)
      cb(0, doc);
    
    return doc;
  };
};

var redisstore = new redis.RedisDocStore();

}