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

    var doc = {
      "id": id,
      "meta": {
        "created_at": new Date(),
        "updated_at": new Date()
      }
    };

    // TODO: what to do if this fails?
    // TODO: create initial list for commits
    self.documents.set(id, doc);

    if (cb) cb(null, doc);

    return doc;
  };

  /**
   * Updates an existing document with the provided metadata object
   * @param id the document id
   * @param meta object containing all metadata
   * @param cb callback
   */

  this.updateMeta = function(id, meta, cb) {
    if (!self.exists(id) && cb) {
      return cb({err: -1, msg: "Document does not exist."});
    }

    var doc = {
      "id": id,
      "meta": meta
    };

    console.log('storing new metadata...', doc);
    self.documents.set(id, doc);
    if (cb) cb(null, doc);
  };


  /**
   * Create a new publication entry, complete with a snapshot
   */

  this.createPublication = function (id, doc, cb) {
    var publicationsKey = id + ":publications";
    var publications = self.redis.asList(publicationsKey);

    var poop = {
      "created_at": new Date(),
      "data": doc
    };

    publications.add(poop);
    if (cb) cb(null);
  };

  /**
   * List all publications 
   */

  this.listPublications = function(id, cb) {
    var publicationsKey = id + ":publications";
    var publications = self.redis.asList(publicationsKey);
    var poops = [];

    for (var idx = 0; idx < publications.size(); idx++) {
      poops.push(publications.getJSON(idx));
    }

    return poops;
  };

  /**
   * Delete an existing publication
   * @param id the document id
   * @param index the publication index
   */

  this.deletePublication = function (id, index, cb) {
    var publicationsKey = id + ":publications";
    var publications = self.redis.asList(publicationsKey);

    if (index < 0 || index >= publications.size()) {
      if (cb) {
        cb({err: -1, msg: "Index out of bounds."});
        return false;
      }

      throw "Index out of bounds.";
    }

    publications.remove(index);

    if(cb) cb(null);

    return true;
  };

  /**
   * Delete all publications for a document
   * Aka "unpublish"
   * @param id the document id
   */

  this.clearPublications = function (id, cb) {
    var publicationsKey = id + ":publications";
    self.redis.remove(publicationsKey);

    if (cb) cb(null);
  };

  /**
   * List all documents complete with metadata
   */

  this.list = function (cb) {
    var docIds = self.documents.getKeys();
    var docs = [];

    for (var idx = 0; idx < docIds.length; ++idx) {
      var doc = self.documents.getJSON(docIds[idx]);
      docs.push(doc);
    }

    // sort the documents in descending order with respect to the time of the last update
    docs.sort(function(a, b) {
      return new Date(b.meta.updated_at) - new Date(a.meta.updated_at);
    });

    if(cb) cb(null, docs);
    return docs;
  };

  /**
   *  Deletes a document
   *  @param cb callback
   */

  this.delete = function (id, cb) {
    self.documents.remove(id);
    self.redis.removeWithPrefix(id);
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

    for(var idx=0; idx<newCommits.length; idx++) {

      var commit = newCommits[idx];

      // commit must be in proper order
      if (typeof lastSha !== undefined && commit.parent != lastSha) {
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

    // save the commits after knowing that everything is fine
    for (var idx = 0; idx < newCommits.length; idx++) {
      // note: these commands will be executed when executeTransaction is called
      //       if something is wrong, e.g., invalid sha sequence, then
      //       the transaction is cancelled.
      commits.addAsString(newCommits[idx].sha);
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
    doc.data = {commits: {}};

    var commits = self.redis.asList(id + ":commits");
    var shas = commits.asArray();
    for (var idx=0; idx<shas.length; ++idx) {
      var commit = self.redis.getJSON( id + ":commits:" + shas[idx]);
      doc.data.commits[shas[idx]] = commit;
    }

    var lastSha = shas.length > 0 ? commits.get() : undefined;

    doc.data.refs = {
      master: lastSha
    };

    if(arguments.length == 2)
      cb(0, doc);
    
    return doc;
  };
};

var redisstore = new redis.RedisDocStore();

}