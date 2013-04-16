// Replicator

Substance.Replicator = function(params) {
  this.store = params.store;
  this.user = params.user; // Current user scope

  var that = this;

  // Start sync
  // -----------------

  this.sync = function(cb) {
  	this.computeJobs(function(err, jobs) {
      console.log('JOBS', jobs);
  		var index = 0;

      function next() {
        if (index === jobs.length) return cb(null);
        that.processDocument(jobs[index], function(err) {
          if (err) console.log('ERROR WHILE PROCSSING JOB', jobs[index], "ERROR", err);
          else console.log("... finished " + jobs[index].action);
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
    console.log("Processing " + doc.action + "...");

    // TODO: refactor this. Could be more 'command pattern'isher...
    //  doc is infact not a doc, but a document command (action, docId).
    //  The functions could be used directly, whereas the first argument is docId
    if (doc.action === "create-remote") return that.createRemote(doc, cb);
    if (doc.action === "create-local") return that.createLocal(doc, cb);
    if (doc.action === "delete-remote") return that.deleteRemote(doc, cb);
    if (doc.action === "delete-local") return that.deleteLocal(doc, cb);
    if (doc.action === "push") return that.push(doc, cb);
    if (doc.action === "pull") return that.pull(doc, cb);
  };

  // Fetch doc from remote store
  // -----------------

  this.createLocal = function(doc, cb) {
    // 1. create doc locally
    localStore.create(doc.id, function(err) {
      if (err) return cb(err);
      // 2. Pull in remote data
      that.pull(doc, cb);
    });
  };

  // Create doc on the server
  // -----------------

  this.createRemote = function(doc, cb) {
    console.log('creating ', doc.id, ' on the server');

    // 1. Get doc from local docstore
    localStore.get(doc.id, function(err, doc) {
      // extract commits
      var commits = localStore.commits(doc.id, doc.refs.tail);
      console.log("COMMITS OF NEW DOC", commits);
      // 2. Create empty doc on the server
      _.request("POST", Substance.settings.hub_api + '/documents', {id: doc.id}, function (err) {
        console.log('created on the server..');
        if (err) return cb(err);
        // 3. Send updates to server
        _.request("PUT", Substance.settings.hub_api + '/documents/'+doc.id, {commits: commits, meta: doc.meta, refs: doc.refs}, function (err) {
          console.log('updated on the server..');
          localStore.setRef(doc.id, 'tail-remote', doc.refs.tail);
          localStore.setRef(doc.id, 'master-remote', doc.refs.master);
          cb(err);
        });
      });
    });
  };

  // Delete doc from hub
  // -----------------

  this.deleteRemote = function(doc, cb) {
    console.log('DELETING REMOTELY:' + doc.id);
    _.request("DELETE", Substance.settings.hub_api+'/documents/' + doc.id, null, function(err, data) {
      // Note: being tolerant if the remote document has been removed already
      // TODO: is there a better way to deal with errors?
      if (!err || err.status === 404) {
        // Note: when a document is deleted locally, a flag is kept to manage remote deletions.
        //  To finish the deletion, the local store needs to be confirmed about deletion.
        localStore.confirmDeletion(doc.id);
        cb(err);
      }
      else return cb(err);
    });
  };

  // Delete doc locally (Someone has deleted it)
  // -----------------

  this.deleteLocal = function(doc, cb) {
    localStore.delete(doc.id);
    cb(null);
  };


  // Pull
  // -----------------
  //
  // TODO: Fetch metadata on pull and update locally / this overwrites pending local commits

  this.pull = function(doc, cb) {
    // Get latest synced commit
    var tailRemote = localStore.getRef(doc.id, 'tail-remote');
    console.log('pulling in changes... for', tailRemote);

    _.request("GET", Substance.settings.hub_api +'/documents/'+doc.id+'/commits', {since: tailRemote}, function(err, data) {
      console.log('what does remote say?', data);
      console.log('remote commits', data.commits);
      // Should also give me remote refs
      // data.commits |data.refs
      if (data.commits.length > 0) {
        localStore.update(doc.id, data.commits, function(err) {
          console.log('applied remote commits.. Any ERRORS?', err);

          // Update references
          localStore.setRef(doc.id, 'master', data.refs.master);
          localStore.setRef(doc.id, 'tail', data.refs.tail); // now done implicitly by update

          // Tail and master are now up to date. Now set 'tail-remote' to new tail
          localStore.setRef(doc.id, 'tail-remote', data.refs.tail);
          localStore.setRef(doc.id, 'master-remote', data.refs.master);

          // Update metadata (remote version)
          localStore.updateMeta(doc.id, data.meta);
          cb(null);
        });
      } else {
        // Update metadata (remote version)
        localStore.updateMeta(doc.id, data.meta);
        cb(null);
      }
    });
  };


  // Push
  // -----------------

  this.push = function(doc, cb) {
    localStore.get(doc.id, function(err, doc) {
      var remoteTail = localStore.getRef(doc.id, 'tail-remote');
      var localTail = localStore.getRef(doc.id, 'tail');

      // Find all commits after synced (remote) commit
      var commits = localStore.commits(doc.id, localTail, remoteTail);

      var data = {
        // username: that.user,
        // id: doc.id,
        commits: commits, // may be empty
        meta: doc.meta,
        refs: doc.refs // make sure refs are updated on the server (for now master, tail is updated implicitly)
      };

      _.request("PUT", Substance.settings.hub_api + '/documents/'+doc.id, data, function (err) {
        // Set synced reference accordingly
        if (err) return cb(err);
        localStore.setRef(doc.id, 'tail-remote', doc.refs.tail);
        localStore.setRef(doc.id, 'master-remote', doc.refs.master);

        cb(null);
      });
    });
  };

  // Compute jobs for dirty documents
  // -----------------

  this.computeJobs = function(cb) {
  	// Status object looks like this
    var jobs = [];
    that.localDocStates(function(err, localDocs) {
      _.request("GET", Substance.settings.hub_api + '/documents', {}, function (err, remoteDocs) {
      _.request("GET", Substance.settings.hub_api + '/collaborations', {}, function (err, collaborations) {

        remoteDocs = _.extend(remoteDocs, collaborations);

        console.log('diff', localDocs, remoteDocs);

        _.each(localDocs, function(doc, id) {
          var remoteDoc = remoteDocs[id];

          // Local refs: these are set if a document had been synched before
          //  otherwise they are undefined
          var masterRemote = localStore.getRef(id, 'master-remote');
          var tailRemote = localStore.getRef(id, 'tail-remote');

          // document does exist locally but not remotely
          if (!remoteDoc) {
            // if it was remote last-time, it must have been deleted remotely
            // and needs to be deleted locally, too
            if (masterRemote) {
              jobs.push({id: id, action: "delete-local"});
            }
            // if it was not remote before, it must be created remotely
            else {
              jobs.push({id: id, action: "create-remote"});
            }
          }
          // document exists locally and remotely
          else {

            // the remote document has been changed.
            // either by adding commits which affects the tail,
            // or by changing the master via undo/redo
            if (tailRemote !== remoteDoc.refs['tail'] || masterRemote !== remoteDoc.refs['master']) {
              jobs.push({id: id, action: "pull"});
            }
            // if there are local changes the locally kept refs for master or tail differ
            else if (tailRemote !== doc.refs['tail'] || masterRemote !== doc.refs['master']) {
              // Local changes only -> Push (fast-forward)
              jobs.push({id: id, action: "push"});
            }

            // retain unsynched remoteDocs: remoteDocs - localDocs
            remoteDocs[id] = undefined;
          }
        });

        // clean up pending local deletions
        _.each(localStore.deletedDocuments(), function(docId) {
            jobs.push({id: docId, action: "delete-remote"}); // delete remotely

            // retain unsynched remoteDocs (part 2): remoteDocs - locally deleted docs
            remoteDocs[docId] = undefined;
        });

        // now remoteDocs contains only document's that have not been local
        // and need to be created locally
        _.each(remoteDocs, function(remoteDoc, id) {
            if(remoteDoc) jobs.push({id: id, action: "create-local"});
        });

        cb(null, jobs);
      })});
    });
  };


  // Ask for status of all local documents
  // -----------------
  //
  // Returns: A hash of document status objects

  this.localDocStates = function(cb) {
    localStore.list(function(err, localDocs) {
      var result = {};
      _.each(localDocs, function(doc) {
        result[doc.id] = doc;
        delete result[doc.id].id;
      });
      cb(null, result);
    });
  };
};
