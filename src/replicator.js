// Replicator

Substance.Replicator = function(params) {
  this.store = params.store;
  this.user = params.user; // Current user scope

  var that = this;

  // Util

  function extractCommits(doc, start, end) {
    var skip = false;
    
    if (start === end) return [];
    var commit = doc.commits[start];

    if (!commit) return [];
    commit.sha = start;

    var commits = [commit];
    var prev = commit;

    while (!skip && (commit = doc.commits[commit.parent])) {
      if (end && commit.sha === end) {
        skip = true;
      } else {
        commit.sha = prev.parent;
        commits.push(commit);
        prev = commit;
      }
    }

    return commits.reverse();
  }

  // Start sync
  // -----------------

  this.sync = function(cb) {
  	this.computeDiff(function(err, jobs) {
      console.log('JOBS', jobs);      
  		var index = 0;

  		function next() {
  			if (index === jobs.length) return cb(null);
  			that.processDocument(jobs[index], function(err) {
  				index += 1;
  				next();
  			});
  		}

  		next(); // start processing the first doc
  	});
  };

  // Process a single doc sync job
  // -----------------

  this.processDocument = function(doc, cb) {
    if (doc.action === "create") return that.create(doc, cb);
    if (doc.action === "update") return that.update(doc, cb);
    if (doc.action === "fetch") return that.fetch(doc, cb);
  };

  // Fetch doc from remote store
  // -----------------

  this.fetch = function(doc, cb) {
    console.log('fetching ', doc.id, ' from server');
    _.request("GET", Substance.settings.hub + '/documents/get/'+that.user+'/'+doc.id, {}, function(err, doc) {

      var commits = extractCommits(doc, doc.refs.tail);
      console.log('commits to be applied locally', commits);

      // 1. create doc locally
      store.create(doc.id, function(err) {
        if (err) return cb(err);
        // 2. send commits
        console.log('storing commits');
        store.update(doc.id, commits, function(err) {
          console.log('updated local doc. ERRORS?', err);
          if (err) return cb(err);
          
          // TODO: Update meta accordingly.
          console.log('updating local metadata from server', doc.meta);

          store.updateMeta(doc.id, doc.meta, function(err) {
            store.setRef(doc.id, 'synced', doc.refs.tail);
            cb(err);
          });
        });
      });
    });
  };


  // Pull
  // -----------------
  // 
  // TODO: Fetch metadata on pull and update locally

  this.pull = function(doc, cb) {
    // Get latest synced commit
    var synced_commit = store.getRef(doc.id, 'synced');
    console.log('pulling in changes...');

    _.request("GET", Substance.settings.hub + '/documents/commits/'+that.user+'/'+doc.id+'/'+synced_commit, {}, function(err, commits) {
      console.log('remote commits', commits);
      if (commits.length > 0) {
        store.update(doc.id, commits, function(err) {
          console.log('applied remote commits.. Any ERRORS?', err);

          // Tail and master are now up to date. Now set 'synced' to new tail
          store.setRef(doc.id, 'synced', store.getRef(doc.id, 'tail'));
          cb(null, false);
        });
      } else {
        cb(null, true);
      }
    });
  };


  // Push
  // -----------------

  this.push = function(doc, cb) {
    store.get(doc.id, function(err, doc) {
      var syncedCommit = store.getRef(doc.id, 'synced');  
      var localTail = store.getRef(doc.id, 'tail');

      var commits = extractCommits(doc, localTail, syncedCommit);
      if (commits.length === 0) return cb(null); // do nothing

      // Send new local commits to server
      _.request("POST", Substance.settings.hub + '/documents/update', {"username": that.user, id: doc.id, commits: commits, meta: doc.meta}, function (err) {
        // Set synced reference accordingly
        if (err) return cb(err);
        store.setRef(doc.id, 'synced', doc.refs.tail);
        cb(null);
      });
    });
  };

  // Sync doc with remote store (bi-directional)
  // -----------------

  this.update = function(doc, cb) {
    that.pull(doc, function(err, fastForward) {
      // For now only fast forward sync works smoothly
      // In case ther are local changes, they are lost (not pushed! what ever is on the server wins)
      if (fastForward) {
        that.push(doc, cb);
        console.log('pull successfull. no changes.. fast forwarding..');  
      } else {
        console.log('pull with changes ignoring local changes');
        cb(null); // done
      }
    });
  };

  // Create doc on the server
  // -----------------

  this.create = function(doc, cb) {
    console.log('creating ', doc.id, ' on the server');

    // 1. Get doc from local docstore
    store.get(doc.id, function(err, doc) {
      // extract commits
      var commits = extractCommits(doc, doc.refs.tail);

      // console.log("COMMITS", commits);
      // 2. Create empty doc on the server
      _.request("POST", Substance.settings.hub + '/documents/create', {"username": that.user, id: doc.id, meta: doc.meta}, function (err) {
        console.log('created on the server..');
        if (err) return cb(err);
        // 3. Send updates to server
        _.request("POST", Substance.settings.hub + '/documents/update', {"username": that.user, id: doc.id, commits: commits}, function (err) {
          store.setRef(doc.id, 'synced', doc.refs.tail);
          cb(err);
        });
      });
    });
  };


  // Compute dirty documents
  // -----------------

  this.computeDiff = function(cb) {
  	// Status object looks like this
    var jobs = [];
    that.localDocStates(function(err, localDocs) {
      _.request("GET", Substance.settings.hub + '/documents/status/'+that.user, {}, function (err, remoteDocs) {
        console.log('diff', localDocs, remoteDocs);

        _.each(localDocs, function(doc, id) {
          var remoteDoc = remoteDocs[id];
          // New unsynced doc?
          if (!remoteDoc) {
            jobs.push({id: id, action: "create"});
            return;
          }

          // Remote changes || local changes
          if (doc.refs['synced'] !== remoteDoc.refs['tail'] || doc.refs['synced'] !== doc.refs['tail']) {
            jobs.push({id: id, action: "update"});
            return;
          }
        });

        _.each(remoteDocs, function(remoteDoc, id) {
          var doc = localDocs[id];

          // New remote doc? -> Fetch
          if (!doc) {
            jobs.push({id: id, action: "fetch"});
            return;
          }
        });

        cb(null, jobs);
      });
    });
  };

  // Ask for status of all local documents
  // -----------------
  // 
  // Returns: A hash of document status objects
  // 
	// {
	// 	"doc-1": {
  // 		"refs": {
  // 			"master": "commit-25",
  // 			"tail": "commit-28"
  // 		}
	// 	},
	// 	"doc-": ...
	// }

  this.localDocStates = function(cb) {
    store.list(function(err, localDocs) {
      var result = {};
      _.each(localDocs, function(doc) {
        result[doc.id] = doc;
        delete result[doc.id].id;
      });
      cb(null, result);
    });
  };

};