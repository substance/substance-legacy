// Replicator

Substance.Replicator = function(params) {
  this.store = params.store;
  this.user = params.user; // Current user scope

  var that = this;

  // Util

  // Commits
  // -----------------
  // 
  // Extract commit series from commits object

  function extractCommits(doc, tail) {
    // Current commit (=head)
    // var commit = this.getRef(ref) || ref;
    // var commit2 = this.getRef(ref2) || ref2;
    // var skip = false;
    
    // if (commit === commit2) return [];

    var commit = doc.commits[tail];
    if (!commit) return [];
    commit.sha = tail;

    var commits = [commit];
    var prev = commit;

    while (!skip && (commit = doc.commits[commit.parent])) {
        commit.sha = prev.parent;
        commits.push(commit);
        prev = commit;
    }

    return commits.reverse();
  }

  // Start sync
  // -----------------

  this.sync = function(cb) {
  	this.computeDiff(function(err, jobs) {
      console.log('JOBS TO BE PROCESSED', jobs);
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
    console.log('processing ', doc);
    if (doc.action === "create") return that.create(doc, cb);
    if (doc.action === "update") return that.update(doc, cb);
    if (doc.action === "fetch") return that.fetch(doc, cb);
  };

  // Fetch doc from remote store
  // -----------------

  this.fetch = function(doc, cb) {
    console.log('fetching ', doc.id, ' from server');
    _.request("GET", Substance.settings.hub + '/documents/get/'+that.user+'/'+doc.id, {}, function(err, doc) {
      console.log('UUH YEAH the new doc', doc);

      var commits = extractCommits(doc);
      console.log('COMMITS', commits);


      // 1. create doc locally
      // store.create(doc.id, function(err, doc) {
      //   // 2. send commits
      //   store.update(doc.id, commits, function(err) {
      //     // TODO: Update meta accordingly.
      //     cb(err);
      //   });
      // });

    });
  };


  // Sync doc with remote store (bi-directional)
  // -----------------

  this.update = function(doc, cb) {
    cb(null);
  };

  // Create doc on the server
  // -----------------

  this.create = function(doc, cb) {
    cb(null);
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

          // Changed doc?
          if (doc.refs['synced'] !== remoteDoc.refs['tail']) {
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