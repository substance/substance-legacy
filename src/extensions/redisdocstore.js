(function(ctx){

  // Native extension
  var redis = typeof exports !== 'undefined' ? require('../dist/redis') : ctx.redis;
  var _ = typeof exports !== 'undefined' ? require('underscore') : ctx._;
  

  var RedisStore = function(settings) {
    // reference to this for use within instance methods
    var self = this;

    this.redis = redis.RedisAccess.Create(0);

    var defaults = {
      host: "127.0.0.1",
      port: 6379,
      scope: "substance"
    };

    var settings = _.extend(defaults, settings);

    this.redis.setHost(settings.host);
    this.redis.setPort(settings.port);

    // the scope is useful to keep parts of the redis db separated
    // e.g. tests would use its own, or one could separate user spaces
    self.redis.setScope(settings.scope);
    self.redis.connect();

    self.documents = self.redis.asHash("documents");

    this.snapshotKey = function(id) {
      return id + ":snapshots"
    };

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

      self.documents.set(id, doc);
      if (cb) cb(null, doc);
    };


    /**
     * List all documents complete with metadata
     */

    this.list = function (cb) {
      var docIds = self.documents.getKeys();
      var docs = [];

      for (var idx = 0; idx < docIds.length; ++idx) {
        var doc = self.documents.getJSON(docIds[idx]);

        doc.refs = {
          "master": self.getRef(docIds[idx], "master"),
          "tail": self.getRef(docIds[idx], "tail"),
        };

        var syncedSha = self.getRef(docIds[idx], "synced");
        if (syncedSha) doc.refs["synced"] = syncedSha;

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

      // Note: we allow to update the document with commits pointing
      //       to a commit that does not need to be the last one.
      //       E.g. this happens after undoing commits and adding new changes.
      //       Instead of deleting the undone commits we keep them as detached refs
      //       which allows to recover such versions.

      // find the parent commit
      var existingCommits = commits.asArray();
      var lastSha = self.getRef(id, "master");

      for(var idx=0; idx<newCommits.length; idx++) {

        var commit = newCommits[idx];

        // commit must be in proper order
        if (lastSha && commit.parent != lastSha) {
          var err = {err: -1, msg: "Invalid commit chain."};
          // TODO: maybe give more details about the problem
          if (cb)
            cb(err);
          else
            console.log(err.msg);
          return false;
        }

        lastSha = commit.sha;
      }

      // save the commits after knowing that everything is fine
      for (var idx = 0; idx < newCommits.length; idx++) {
        var commit = newCommits[idx];
        if (!_.isObject(commit)) throw "Can not store empty commit.";

        commits.addAsString(commit.sha);
        // store the commit's data into an own field
        self.redis.set(commitsKey + ":" + newCommits[idx].sha, commit);
      }

      self.setRef(id, "master", lastSha);
      self.setRef(id, "tail", lastSha);

      console.log('Stored these commits in the database', newCommits);

      if (cb) cb(null);
      return true;
    };

    this.setRef = function(id, ref, sha, cb) {
      self.redis.setString(id + ":refs:" + ref, sha);
      if (cb) cb(null);
    }

    this.getRef = function(id, ref, cb) {
      var key = id + ":refs:" + ref;
      var sha = self.redis.exists(key) ? self.redis.get(key) : null;

      if(cb) cb(0, sha);
      return sha;
    }

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
        if(arguments.length === 2) {
          cb({err: -1, msg: "Document does not exist."}, undefined);
        } else {
          throw "Document does not exist."
        }
      }

      var doc = self.documents.getJSON(id);
      doc.commits = {};

      var commits = self.redis.asList(id + ":commits");

      // Note: Commits are stored non-destructively, i.e., after undos
      //       new commits will be appended pointing to a commit before
      //       the reverted commits.
      //       To retrieve the documents commits we have to traverse the commits
      //       beginning from the commit referenced by master.
      var lastSha = self.getRef(id, "tail");

      doc.refs = {
        "master": self.getRef(id, "master"),
        "tail": lastSha,
      };

      var syncedSha = self.getRef(id, "synced");

      if (syncedSha) doc.refs["synced"] = syncedSha;

      if (commits.size() > 0) {
        var currentSha = lastSha;

        for (;;) {
          if(!currentSha) break;

          var commit = self.redis.getJSON( id + ":commits:" + currentSha);
          if (!commit) {
            console.log('Corrupted Document: ', doc);
            throw "Document corrupted, contains empty commit";
          }
          doc.commits[currentSha] = commit;

          // pick the parent sha and continue
          // note: this will stop iteration after the first commit has been processed
          currentSha = commit.parent;
        }
      }

      if (lastSha && !doc.commits[lastSha]) {
        console.log('Corrupted Document: ', doc);
        throw "Document corrupted, contains empty commit";
      }

      if(cb) cb(0, doc);
      return doc;
    };

  };
  
  // Exports
  if (typeof exports !== 'undefined') {
    // Store = exports;
    // exports.Store = Store;
    exports.RedisStore = RedisStore;
    // exports.redisstore = new RedisStore();
  } else {
    ctx.RedisStore = RedisStore; // -> window.Substance.RedisStore
    // window.redisstore = new RedisStore();
  }
})(this);