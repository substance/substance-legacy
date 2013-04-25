// Replicator

(function() {

var root = this;
var util = Substance.util;

var Replicator = function(params) {

  this.localStore = params.localStore;
  this.remoteStore = params.remoteStore;
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
    function createDoc(data, cb) {
      that.localStore.create(doc.id, cb);
    }

    function pull(data, cb) {
      that.pull(doc, cb);
    }

    util.async([createDoc, pull], cb);
  };

  // Create doc on the server
  // -----------------

  this.createRemote = function(docInfo, cb) {
    console.log('creating ', docInfo.id, ' on the server');

    var commits;
    var doc;

    // 1. Get doc from local docstore
    function getLocalDoc(data, cb) {
      that.localStore.get(docInfo.id, cb);
    }

    function extractLocalCommits(data, cb) {
      doc = data;
      that.localStore.commits(doc.id, doc.refs.master.last, null, cb);
    }

    function createRemoteDoc(data, cb) {
      commits = data;
      console.log("commits", commits);
      console.log("COMMITS OF NEW DOC", commits);

      that.remoteStore.create(doc.id, cb);
    }

    function updateRemoteDoc(data, cb) {
      that.remoteStore.update(doc.id, commits, doc.meta, doc.refs, cb)
    }

    function setRefs(data, cb) {
      that.localStore.setRefs(doc.id, "remote:master", doc.refs.master, cb);
    }

    util.async([getLocalDoc, extractLocalCommits, createRemoteDoc, updateRemoteDoc, setRefs], cb);
  };

  // Delete doc from hub
  // -----------------

  this.deleteRemote = function(doc, cb) {


    function delRemote(data, cb) {
      console.log('DELETING REMOTELY:' + doc.id);
      that.remoteStore.delete(doc.id, function(err) {
        // Note: being tolerant if the remote document has been removed already
        // TODO: is there a better way to deal with errors?
        if (!err || err.status === 404 || err.error === 404) cb(null);
        else cb(err);
      });
    }

    function confirmDelete(data, cb) {
      that.localStore.confirmDeletion(doc.id, cb);
    }

    util.async([delRemote, confirmDelete], cb);
  };

  // Delete doc locally (Someone has deleted it)
  // -----------------

  this.deleteLocal = function(doc, cb) {
    that.localStore.delete(doc.id, function(err, data) {
      if (err) return cb(err);
      that.localStore.confirmDeletion(doc.id, cb);
    });
  };

  // Pull
  // -----------------
  //
  // TODO: Fetch metadata on pull and update locally / this overwrites last local commits

  this.pull = function(doc, cb) {

    var lastRemote;

    function getRefs(data, cb) {
      that.localStore.getRefs(doc.id, cb);
    }

    function getCommits (data, cb) {
      lastRemote = (data['remote:master']) ? data['remote:master'].last : null;

      console.log('pulling in changes... for', lastRemote);
      that.remoteStore.commits(doc.id, null, lastRemote, cb);
    }

    function pullData(data, cb) {
      if (data.commits.length > 0) {
        var refs = {
          'master': data.refs.master,
          'remote:master': data.refs.master
        };
        that.localStore.update(doc.id, data.commits, data.meta, refs, cb)
      } else {
        that.localStore.update(doc.id, null, data.meta, null, cb)
      }
    }

    util.async([getRefs, getCommits, pullData], cb);
  };

  this.push = function(docInfo, cb) {

    var doc;
    var lastLocal;
    var lastRemote;
    var commits;

    function getDoc(data, cb) {
      console.log('pushing changes...', lastRemote);
      that.localStore.get(docInfo.id, cb);
    }

    function getRefs(data, cb) {
      doc = data;
      that.localStore.getRefs(doc.id, cb);
    }

    function getCommits(data, cb) {
      lastLocal = data.master.last;
      lastRemote = (data['remote:master']) ? data['remote:master'].last : null;

      // Find all commits after synced (remote) commit
      that.localStore.commits(doc.id, lastLocal, lastRemote, cb);
    }

    function pushData(data, cb) {
      commits = data;
      var refs = {
        'master': doc.refs.master
      }
      that.remoteStore.update(doc.id, commits, doc.meta, refs, cb);
    }

    function setLocalRefs(data, cb) {
      var refs = doc.refs;
      refs['remote:master'] = doc.refs.master;
      that.localStore.update(doc.id, null, null, refs, cb);
    }

    util.async([getDoc, getRefs, getCommits, pushData, setLocalRefs], cb);
  };


  // Compute jobs for dirty documents
  // -----------------

  this.computeJobs = function(cb) {
  	// Status object looks like this
    var jobs = [];
    var localDocs;
    var remoteDocs;

    function getLocalStates(data, cb) {

      that.localDocStates(cb);
    }

    function getRemoteDocs(data, cb) {
      localDocs = data;
      console.log("localDocs", localDocs);

      that.remoteStore.list(cb);
    }

    function getCollabDocs(data, cb) {
      remoteDocs = data;
      console.log("remoteDocs", remoteDocs);

      // TODO: collaborations is currently a Hub only feature
      // Replicator should use two Store instances
      // and remote_store should mix these into the previous result?
      console.log("TODO: let remote store provide collaborating docs.");
      cb(null);
    }

    var processDocs = util.async.each({
      selector: function(data) { return localDocs; },
      iterator: function(localDoc, id, cb) {
        var remoteDoc = remoteDocs[id];
        var headRemote = (localDoc.refs['remote:master']) ? localDoc.refs['remote:master'].head : null;
        var lastRemote = (localDoc.refs['remote:master']) ? localDoc.refs['remote:master'].last : null;

        // document does exist locally but not remotely
        if (!remoteDoc) {
          // if it was remote last-time, it must have been deleted remotely
          // and needs to be deleted locally, too
          if (headRemote) {
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
          if (lastRemote !== remoteDoc.refs['master']['last']
            || headRemote !== remoteDoc.refs['master']['head']) {
            jobs.push({id: id, action: "pull"});
          }
          // if there are local changes the locally kept refs for master or tail differ
          else if (lastRemote !== localDoc.refs['master']['last']
            || headRemote !== localDoc.refs['master']['head']) {
            // Local changes only -> Push (fast-forward)
            jobs.push({id: id, action: "push"});
          }

          // retain unsynched remoteDocs: remoteDocs - localDocs
          remoteDocs[id] = undefined;
        }

        cb(null);
      }
    });

    function processRest(data, cb) {
      _.each(that.localStore.deletedDocuments(), function(docId) {
        jobs.push({id: docId, action: "delete-remote"}); // delete remotely

        // retain unsynched remoteDocs (part 2): remoteDocs - locally deleted docs
        remoteDocs[docId] = undefined;
      });
      // now remoteDocs contains only document's that have not been local
      // and need to be created locally
      _.each(remoteDocs, function(remoteDoc, id) {
        if(remoteDoc) jobs.push({id: id, action: "create-local"});
      });

      cb(null);
    }

    util.async([getLocalStates, getRemoteDocs, getCollabDocs,
      processDocs, processRest], util.propagate(jobs, cb));
  };


  // Ask for status of all local documents
  // -----------------
  //
  // Returns: A hash of document status objects

  this.localDocStates = function(cb) {

    that.localStore.list(function(err, localDocs) {
      if (err) return cb(err);
      
      var result = {};
      _.each(localDocs, function(doc) {
        result[doc.id] = doc;
        delete result[doc.id].id;
      });
      cb(null, result);
    });
  };
};

root.Substance.Replicator = Replicator;

}).call(this);

