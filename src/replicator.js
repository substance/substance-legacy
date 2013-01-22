// Replicator

Substance.Replicator = function(params) {
  this.store = params.store;
  this.user = params.user; // Current user scope

  // this.remote = "https://substance.io/api/v1";

  var that = this;

  // Start sync
  // -----------------

  this.sync = function(cb) {
  	this.computeDiff(function(documents) {
  		var index = 0;

  		function next() {
  			if (index === documents.length) return cb(null);
  			that.syncDocument(documents[index], function(err) {
  				index += 1;
  				next();
  			});
  		}

  		next(); // start processing the first doc
  	});
  };

  // Compute dirty documents
  // -----------------
  // 
  // Returns: A list of documents that need to be synchronized
  // 
	// ["doc-1", "doc-2", "doc-3"]

  this.computeDiff = function() {
  	// Status object looks like this
  	
  	that.localDocStates(function(err, localDocs) {
	  	that.remoteDocStates(function(err, remoteDocs) {
	  		// Compute diff
	  	});
  	});
  };


  // Ask for status of all local
  // -----------------
  // 
  // Returns: A hash of document states
  // 
	// {
	// 	"doc-1": {
  // 		"rev": "eb7f0f56",
  // 		"refs": {
  // 			"master": "commit-25",
  // 			"tail": "commit-28"
  // 		}
	// 	},
	// 	"doc-": ...
	// }

  this.localDocStates = function(cb) {
  	// Ask local store for status of all shared documents
    this.store.getDocStates(cb);
  };

  // Ask for status of all local
  // -----------------
  // 
  // Returns: A hash of document states
  // 
	// {
	// 	"doc-1": {
  // 		"rev": "eb7f0f56",
  // 		"refs": {
  // 			"master": "commit-25",
  // 			"tail": "commit-28"
  // 		}
	// 	},
	// 	"doc-": ...
	// }

  this.remoteDocStates = function(cb) {

  	// Ask remote store for status of all shared documents of a particular user
		  $.ajax({
		    type: 'GET',
		    url: Substance.settings.hub + '/document_states/:user', 
		    success: function(commits) {
		      if (result.status === "error") return cb('Error');
		      cb(null, commits);
		    },
		    error: function() {
		      cb('Error.');
		    },
		    dataType: 'json'
		  });
  };

  // Synchronize a single document
  // -----------------

  this.syncDocument = function(id, cb) {

		var doc = this.store.getDocInfo(id);

	  // Pull new commits from server
	  // -----------------
	  // 
	  // Returns: A list of commits that must be applied to local doc

  	function pullCommits(cb) {
		  $.ajax({
		    type: 'GET',
		    url: Substance.settings.hub + '/pull_commits/doc-1/last-synced-local-commit',
		    success: function(commits) {
		      if (result.status === "error") return cb('Error');
		      cb(null, commits);
		    },
		    error: function() {
		      cb('Error.');
		    },
		    dataType: 'json'
		  });
  	}

	  // Push new commits to server
	  // -----------------

  	function pushCommits() {
		  $.ajax({
		    type: 'POST',
		    url: Substance.settings.hub + '/push_commits/doc-1/last-synced-local-commit',
		    data: {
		    	commits: "JSON_SERIALIZED_COMMITS"
		    },
		    success: function(commits) {
		      if (result.status === "error") return cb('Error');
		      cb(null, commits);
		    },
		    error: function() {
		      cb('Error.');
		    },
		    dataType: 'json'
		  });
  	}

	  // Write new commits that we just received from the Hub
	  // -----------------

  	function writeCommits(commits, cb) {
  		that.store.update(doc.id, commits, cb);
  	}
  	
  	pullCommits(function(err, commits) {
  		writeCommits(commits, function() {
  			pushCommits(function(err) {
  				cb(null); // document successfully synced
  			});
  		});
  	});
  };
};