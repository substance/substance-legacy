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

  // TODO: can this also be solved by delegating to push?
  this.createRemote = function(docInfo, cb) {
    console.log("replicator.createRemote", docInfo);

    var commits;
    var blobs;
    var doc;

    // 1. Get doc from local docstore
    function getLocalDoc(data, cb) {
      that.localStore.get(docInfo.id, cb);
    }

    function extractLocalCommits(data, cb) {
      doc = data;
      if (!doc.refs.master || !doc.refs.master.last) return cb(null, []);
      that.localStore.commits(doc.id, doc.refs.master.last, null, function(err, data) {
        commits = data;
        cb(err);
      });
    }

    function getBlobs(data, cb) {
      that.localStore.listBlobs(docInfo.id, function(err, data) {
        if (err) return cb(err);

        var blobIds = data;
        var options = {
          items: blobIds,
          iterator: function (blobId, cb) {
            that.localStore.getBlob(docInfo.id, blobId, function(err, data) {
              if (err) return cb(err);
              blobs.push(data);
              cb(null);
            })
          }
        };
        util.async.iterator(options)(null, cb);
      })
    }

    function createRemoteDoc(data, cb) {
      //console.log("replicator.createRemote: commits", commits);
      that.remoteStore.create(doc.id, cb);
    }

    function updateRemoteDoc(data, cb) {
      var options = {
        commits: commits,
        meta: doc.meta,
        refs: doc.refs
      };
      that.remoteStore.update(doc.id, options, cb)
    }

    function setRefs(data, cb) {
      var refs = {
        "remote-head": doc.refs.master ? doc.refs.master.head : null,
        "remote-last": doc.refs.master ? doc.refs.master.last : null,
      };
      that.localStore.setRefs(doc.id, "master", refs, cb);
    }

    var createRemoteBlobs = util.async.iterator({
      items: blobs,
      iterator: function(blob, cb) {
        that.remoteStore.createBlob(blob.document, blob.id, blob.data, cb);
      }
    });

    var options = {
      functions: [getLocalDoc, extractLocalCommits, getBlobs,
        createRemoteDoc, updateRemoteDoc, setRefs, createRemoteBlobs]
    };
    util.async.sequential(options, cb);
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


  function getDiffBlobs(src, dst, docId, cb) {
    dst.listBlobs(docId, function(err, data) {
      if (err) return cb(err);

      var dstBlobs = data;
      console.log("replicator.getDiffBlobs: dstBlobs", dstBlobs)

      src.listBlobs(docId, function(err, data) {
        if (err) return cb(err);

        var srcBlobs = data;
        console.log("replicator.getDiffBlobs: srcBlobs", srcBlobs)

        var blobIds = _.without(srcBlobs, dstBlobs);
        console.log("replicator.getDiffBlobs: blobIds", blobIds)

        var blobs = [];

        util.async.iterator({
          items: blobIds,
          iterator: function(blobId, cb) {
            src.getBlob(blobId, function(err, blob) {
              if (err) return cb(err);
              blobs.push(blob);
              cb(null);
            });
          },
          finally: function(err, data) {
            console.log("replicator.getDiffBlobs: blobs", blobs);
            cb(null, blobs);
          }
        })(null, cb);
      });
    });
  }

  // Pull
  // -----------------
  //
  // TODO: Fetch metadata on pull and update locally / this overwrites last local commits

  this.pull = function(doc, cb) {
    console.log("replicator.pull", doc);

    var lastRemote;
    var docData;
    var blobs;

    function getRefs(data, cb) {
      that.localStore.getRefs(doc.id, cb);
    }

    function getCommits (data, cb) {
      lastRemote = (data['master']) ? data['master']['remote-last'] : null;

      //console.log('pulling in changes for', doc.id, 'starting from', lastRemote);
      that.remoteStore.commits(doc.id, null, lastRemote, function(err, data) {
        docData = data;
        cb(err);
      });
    }

    function getBlobs(data, cb) {
      getDiffBlobs(that.remoteStore, that.localStore, doc.id, function(err, data) {
        blobs = data;
        cb(err);
      });
    }

    function storeData(data, cb) {
      if (docData.commits.length > 0) {
        var refs = _.clone(docData.refs.master);
        refs["remote-head"] = refs.head;
        refs["remote-last"] = refs.last;

        var options = {
          commits: docData.commits,
          meta:  docData.meta,
          refs: {"master": refs}
        };
        that.localStore.update(doc.id, options, cb);
      } else {
        var options = {
          meta:  docData.meta,
        };
        that.localStore.update(doc.id, null, docData.meta, null, cb)
      }
    }

    function storeBlobs(data, cb) {
      util.async.iterator({
        items: blobs,
        iterator: function(blob, cb) {
          that.localStore.createBlob(blob.document, blob.id, blob.data, cb);
        }
      })(null, cb);
    }

    var options = {
      functions: [getRefs, getCommits, getBlobs, storeData, storeBlobs]
    };
    util.async.sequential(options, cb);
  };

  this.push = function(docInfo, cb) {
    console.log("replicator.push", docInfo);

    var doc;
    var lastLocal;
    var lastRemote;
    var commits;
    var blobs;

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

    function getBlobs(data, cb) {
      getDiffBlobs(that.localStore, that.remoteStore, doc.id, function(err, data) {
        blobs = data;
        cb(err);
      });
    }

    function storeData(data, cb) {
      commits = data;

      var options = {
        commits: commits,
        meta:  doc.meta,
        refs: { 'master': doc.refs.master || {} }
      };
      that.remoteStore.update(doc.id, options, cb);
    }

    function setLocalRefs(data, cb) {
      var refs = doc.refs;
      refs['master']['remote-head'] = refs.master.head;
      refs['master']['remote-last'] = refs.master.last;

      var options = { refs: refs };
      that.localStore.update(doc.id, options, cb);
    }

    function storeBlobs(data, cb) {
      util.async.iterator({
        items: blobs,
        iterator: function(blob, cb) {
          that.localStore.createBlob(blob.document, blob.id, blob.data, cb);
        }
      })(null, cb);
    }

    var options = {
      functions: [getDoc, getRefs, getCommits, storeData, setLocalRefs, storeBlobs]
    };
    util.async.sequential(options, cb);
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

    var processJob = function(job, cb) {
      // TODO: refactor this. Could be more 'command pattern'isher...
      //  doc is infact not a doc, but a document command (action, docId).
      //  The functions could be used directly, whereas the first argument is docId
      if (job.action === "create-remote") return that.createRemote(job, cb);
      if (job.action === "create-local") return that.createLocal(job, cb);
      if (job.action === "delete-remote") return that.deleteRemote(job, cb);
      if (job.action === "delete-local") return that.deleteLocal(job, cb);
      if (job.action === "push") return that.push(job, cb);
      if (job.action === "pull") return that.pull(job, cb);
    };

    var processJobs = util.async.iterator({
      selector: function(jobs) { return jobs; },
      iterator: function(job, cb) {
        processJob(job, cb);
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

