// check if the redis native extension is available
if (typeof redis !== "undefined" || typeof redis.RedisAccess !== "undefined") {

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
    
    if(typeof cb !== "undefined")
      cb({err: 0, result: result});
    
    return result;
  };

  /**
   * Creates a new document with the provided id
   * @param cb callback
   */
  this.create = function (id, cb) {

    if(self.exists(id, cb) && typeof cb !== "undefined") {
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
    self.redis.remove(id);
    
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
    var commits = self.redis.asList(id + ":commits");
    
    // TODO: if commits is undefined create a list type

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

  /**
   * Retrieves a document
   * 
   * @param id the document's id
   * @param cb callback
   */
  this.get = function(id, cb) {

    if(!self.exists(id, cb) && typeof cb !== "undefined") {
      cb({err: -1, msg: "Document does not exist.", doc: undefined});
      return undefined;
    }

    var doc = self.redis.getJSON(id);
    //TODO:
    // var commits = self.redis.asList(id + ":commits");
    // doc.commits = commits.asArray();
    if(!self.exists(id, cb) && typeof cb !== "undefined")
      cb({err: 0, doc: doc});

    return doc;
  };
};

}

