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
     * List all documents but exclude docs that are flagged as deleted
     */

    this.listWithoutDeleted = function(cb) {
      var docs = this.list();
      var result = [];

      _.each(docs, function(doc) {
        // Don't show if flagged as deleted
        if (!self.isDeleted(doc.id)) {
          result.push(doc);
        }
      });

      if (cb) cb(null, result);
      return result;
    };

    /**
     *  Permanently deletes a document
     *  @param cb callback
     */

    this.delete = function (id, cb) {
      self.documents.remove(id);
      self.redis.removeWithPrefix(id);

      var deletedDocs = self.redis.asHash("deleted-documents");
      deletedDocs.remove(id);

      if (cb) cb(null);
      return true;
    };

    /**
     *  Marks a document as deleted
     *  Will be removed on next sync
     *  @param cb callback
     */

    this.markAsDeleted = function(id, cb) {
      if (self.exists(id)) {
        var deletedDocs = self.redis.asHash("deleted-documents");
        deletedDocs.set(id, id);
        cb(null);
        return true;
      }
      cb('not found');
      return false;
    };


    this.isDeleted = function(id, cb) {
      var deletedDocs = self.redis.asHash("deleted-documents");
      var res = deletedDocs.contains(id);
      if (cb) cb(null, res);
      return res;
    };

    /**
     *  Retrieves all documents that are marked as deleted
     *  Will be removed on next sync
     *  @param cb callback
     */

    this.deletedDocuments = function(cb) {
      var deletedDocs = self.redis.asHash("deleted-documents");
      return deletedDocs.getKeys();
    };

    /**
     *  Stores a sequence of commits for a given document id.
     *
     *  @param newCommits an array of commit objects
     *  @param cb callback
     */

    this.update = function(id, newCommits, cb) {
      // No commits supplied. Go ahead
      if (newCommits.length === 0) {
        cb(null);
        return true;
      }

      var commitsKey = id + ":commits";
      var commits = self.redis.asList(commitsKey);

      // Note: we allow to update the document with commits pointing
      //       to a commit that does not need to be the last one.
      //       E.g. this happens after undoing commits and adding new changes.
      //       Instead of deleting the undone commits we keep them as detached refs
      //       which allows to recover such versions.

      // Find the parent commit
      var lastSha = newCommits[0].parent;
      if (lastSha && !self.redis.exists(commitsKey + ":" + lastSha)) {
        var msg = "Parent commit not found.";
        cb ? cb({"error": msg}) : console.log(msg);
        return false;
      }

      for(var idx=0; idx<newCommits.length; idx++) {

        var commit = newCommits[idx];

        // commit must be in proper order
        if (lastSha && commit.parent != lastSha) {
          var err = {err: -1, msg: "Invalid commit chain."};
          cb ? cb(err) : console.log(err.msg);
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
    };

    this.getRef = function(id, ref, cb) {
      var key = id + ":refs:" + ref;
      var sha = self.redis.exists(key) ? self.redis.get(key) : null;

      if(cb) cb(0, sha);
      return sha;
    };

    this.setSnapshot = function (id, data, title, cb) {
      var snapshots = self.redis.asHash(self.snapshotKey(id));
      snapshots.set(title, data);
      if(cb) { cb(null); }
    };


    /**
     * Retrieves a range of the document's commits
     *
     * @param id the document's id
     * @param head where to start traversing the commits
     * @param stop the commit that is excluded
     */

    this.commits = function(id, head, stop, cb) {

      function getCommit(sha) {
        return self.redis.getJSON( id + ":commits:" + sha);
      }

      if (head === stop) return [];
      var commit = getCommit(head);

      if (!commit) {
        if (cb) cb(null, []);
        return [];
      }

      commit.sha = head;

      var commits = [commit];
      var prev = commit;

      while (commit = getCommit(commit.parent)) {
        if (stop && commit.sha === stop) break;
        commit.sha = prev.parent;
        commits.push(commit);
        prev = commit;
      }

      commits = commits.reverse();
      if (cb) cb(null, commits);
      return commits;
    };

    /**
     * Retrieves a document
     *
     * @param id the document's id
     * @param cb callback
     */
    this.get = function(id, cb) {

      if(!self.exists(id)) {
        if (cb) cb({error: "Document does not exist."});
        return null;
      }

      console.log('meeh');

      var doc = self.documents.getJSON(id);
      doc.commits = {};

      var lastSha = self.getRef(id, "tail");

      doc.refs = {
        "master": self.getRef(id, "master"),
        "tail": lastSha,
      };

      if (lastSha) {
        var commits = self.commits(id, lastSha);

        _.each(commits, function(c) {
          doc.commits[c.sha] = c;
        });        
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