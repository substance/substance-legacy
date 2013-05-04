// Replicator

(function() {

var root = this;
var util = Substance.util;

var Replicator = function(params) {

  this.localStore = params.localStore;
  this.remoteStore = params.remoteStore;
  this.user = params.user; // Current user scope

  var that = this;

  // Process a single doc sync job
  // -----------------

  this.processDocument = function(doc, cb) {
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
    console.log("replicator.createLocal", doc);

    // 1. create doc locally
    function createDoc(data, cb) {
      that.localStore.create(doc.id, cb);
    }

    function pull(data, cb) {
      //console.log("replicator.createLocal: pulling", doc);
      that.pull(doc, cb);
    }

    util.async([createDoc, pull], cb);
  };

  // Create doc on the server
  // -----------------

  this.createRemote = function(docInfo, cb) {
    console.log("replicator.createRemote", docInfo);

    var commits;
    var doc;

    // 1. Get doc from local docstore
    function getLocalDoc(data, cb) {
      that.localStore.get(docInfo.id, cb);
    }

    function extractLocalCommits(data, cb) {
      doc = data;
      if (!doc.refs.master || !doc.refs.master.last) return cb(null, []);
      that.localStore.commits(doc.id, doc.refs.master.last, null, cb);
    }

    function createRemoteDoc(data, cb) {
      commits = data;
      //console.log("replicator.createRemote: commits", commits);
      that.remoteStore.create(doc.id, cb);
    }

    function updateRemoteDoc(data, cb) {
      that.remoteStore.update(doc.id, commits, doc.meta, doc.refs, cb)
    }

    function setRefs(data, cb) {
      var refs = {
        "remote-head": doc.refs.master ? doc.refs.master.head : null,
        "remote-last": doc.refs.master ? doc.refs.master.last : null,
      };
      that.localStore.setRefs(doc.id, "master", refs, cb);
    }

    util.async([getLocalDoc, extractLocalCommits, createRemoteDoc, updateRemoteDoc, setRefs], cb);
  };

  // Delete doc from hub
  // -----------------

  this.deleteRemote = function(doc, cb) {
    console.log("replicator.deleteRemote", doc);

    function delRemote(data, cb) {
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
    console.log("replicator.deleteLocal", doc);

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
    console.log("replicator.pull", doc);

    var lastRemote;

    function getRefs(data, cb) {
      that.localStore.getRefs(doc.id, cb);
    }

    function getCommits (data, cb) {
      lastRemote = (data['master']) ? data['master']['remote-last'] : null;

      //console.log('pulling in changes for', doc.id, 'starting from', lastRemote);
      that.remoteStore.commits(doc.id, null, lastRemote, cb);
    }

    function pullData(data, cb) {
      if (data.commits.length > 0) {
        var refs = _.clone(data.refs.master);
        refs["remote-head"] = refs.head;
        refs["remote-last"] = refs.last;

        that.localStore.update(doc.id, data.commits, data.meta, {"master": refs}, cb);
      } else {
        that.localStore.update(doc.id, null, data.meta, null, cb)
      }
    }

    util.async([getRefs, getCommits, pullData], cb);
  };

  this.push = function(docInfo, cb) {
    console.log("replicator.push", docInfo);

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
      lastRemote = (data['master']) ? data['master']['remote-last'] : null;

      // Find all commits after synced (remote) commit
      that.localStore.commits(doc.id, lastLocal, lastRemote, cb);
    }

    function pushData(data, cb) {
      commits = data;
      var refs = {
        'master': doc.refs.master || {}
      };
      that.remoteStore.update(doc.id, commits, doc.meta, refs, cb);
    }

    function setLocalRefs(data, cb) {
      var refs = doc.refs;
      refs['master']['remote-head'] = refs.master.head;
      refs['master']['remote-last'] = refs.master.last;

      that.localStore.update(doc.id, null, null, refs, cb);
    }

    util.async([getDoc, getRefs, getCommits, pushData, setLocalRefs], cb);
  };


  // Compute jobs for dirty documents
  // -----------------

  this.computeJobs = function(ignored, cb) {
    //console.log("replicator.computeJobs");

  	// Status object looks like this
    var jobs = [];
    var localDocs;
    var remoteDocs;

    function getLocalStates(data, cb) {
      that.localDocStates(cb);
    }

    function getRemoteDocs(data, cb) {
      localDocs = data;
      //console.log("replicator.computeJobs: localDocs=", localDocs);

      that.remoteStore.list(function(err, documents) {
        remoteDocs = documents;
        //console.log("replicator.computeJobs: remoteDocs=", localDocs);

        cb(err);
      });
    }

    var processDocs = util.async.iterator({
      selector: function(data) { return localDocs; },
      iterator: function(localDoc, id, cb) {
        var remoteDoc = remoteDocs[id];

        var head = localDoc.refs['master'] ? localDoc.refs['master']['head'] : null;
        var last = localDoc.refs['master'] ? localDoc.refs['master']['last'] : null;

        var headRemote = (localDoc.refs['master']) ? localDoc.refs['master']['remote-head'] : null;
        var lastRemote = (localDoc.refs['master']) ? localDoc.refs['master']['remote-last'] : null;

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

          var headRemoteUpstream = remoteDoc.refs['master'] ? remoteDoc.refs['master']['head'] : null;
          var lastRemoteUpstream = remoteDoc.refs['master'] ? remoteDoc.refs['master']['last'] : null;


          // the remote document has been changed.
          // either by adding commits which affects the tail,
          // or by changing the master via undo/redo
          if (lastRemote !== lastRemoteUpstream || headRemote !== headRemoteUpstream) {
            jobs.push({id: id, action: "pull"});
          }
          // if there are local changes the locally kept refs for master or tail differ
          else if (lastRemote !== last || headRemote !== head) {
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

    util.async([getLocalStates, getRemoteDocs,
      processDocs, processRest], function(err, data) {
        console.log("replicator.computeJobs: jobs=", jobs);
        cb(err, jobs);
      });
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

  // Start sync
  // -----------------

  this.sync = function(cb) {
    if (this.syncing) return cb(null); // do nothing
    this.syncing = true;

    var processJobs = util.async.iterator({
      selector: function(jobs) { return jobs; },
      iterator: function(job, cb) {
        that.processDocument(job, cb);
      }
    });

    var options = {
      functions: [this.computeJobs, processJobs],
      finally: function(err, data) {
        that.syncing = false;
        cb(err, data);
      }
    }
    util.async.sequential(options, cb);
  };
};

root.Substance.Replicator = Replicator;

}).call(this);

