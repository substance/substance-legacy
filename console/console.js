$(function() {

  // Util
  // ---------------

  // Render Underscore templates
  _.tpl = function (tpl, ctx) {
    var source = $('script[name='+tpl+']').html();

    return _.template(source, ctx);
  };



  var Router = Backbone.Router.extend({
    initialize: function() {
      // Using this.route, because order matters
      this.route(':user/:document', 'loadDocument', this.loadDocument);
      this.route('new', 'newDocument', this.newDocument);
      this.route('', 'start', this.loadDocument);
    },

    newDocument: function() {
      app.document(Substance.util.uuid());
    },

    loadDocument: function(user, id) {
      app.document(user, id || "empty.json");
    }
  });


  // Welcome screen
  // ---------------

  var Start = Backbone.View.extend({
    render: function() {
      this.$el.html(_.tpl('start'));
    }
  });


  // The Mothership
  // ---------------

  var Application = Backbone.View.extend({
    events: {
      'change #document_id': '_loadDocument'
    },

    _loadDocument: function(e) {
      var id = $('#document_id').val();
      this.document(id);
    },

    initialize: function (options) {
      // Load some data
      // this.document = new Document();
    },

    // Toggle document view
    document: function(user, id) {
      var that = this;

      router.navigate([user, id].join('/'), false);

      // Select correct doc in dropdown
      $('option[value="'+id+'"]').attr('selected', 'true');

      loadDocument(user, id, function(err, rawDoc) {
        store.list(function(err, documents) {
          var doc = new Substance.Document(rawDoc);

          // Add global ref for convenience
          window.doc = doc;

          that.model = { documents: documents };

          that.render();

          doc.on('commit:applied', function(commit) {
            // Send update to the server
            updateDoc(doc, commit);
          }, this);

          doc.on('ref:updated', function(ref, sha) {
            updateRef(doc, ref, sha);
          }, this);

          that.view = new Document({el: '#document', model: doc });
          that.view.render();
        });
      });
    },

    // Toggle Start view
    start: function() {

    },

    // Render application template
    render: function() {
      this.$el.html(_.tpl('application', {
        documents: this.model.documents
      }));
    }
  });

  // Document Visualization
  // ---------------

  var Document = Backbone.View.extend({
    events: {
      'click .operation': '_checkoutOperation',
      'click .apply-operation': '_applyOperation',
      'change #select_scope': '_selectScope',
      'change #select_example': '_selectExample',
      'click .toggle-output': '_toggleOutput',
      'focus .console textarea': '_makeEditable'
    },

    _makeEditable: function() {
      this.$('#command').removeClass('inactive');
      this.$('.apply-operation').addClass('active');
    },

    _toggleOutput: function(e) {
      var view = $(e.currentTarget).attr('data-output');
      
      this.$('.toggle-output').removeClass('active');
      this.$(e.currentTarget).addClass('active');

      if (view === "visualization") {
        this.render();
      } else if (view === "content") {
        this.$('.output .document').html('<textarea class="json">'+JSON.stringify(this.model.toJSON(), null, '  ')+'</textarea>');
      } else {
        this.$('.output .document').html('<textarea class="json">'+JSON.stringify(this.model.export(), null, '  ')+'</textarea>');
      }
      return false;
    },

    _selectScope: function() {
      this.scope = $('#select_scope').val();
      this.render();
      return false;
    },

    _selectExample: function() {
      this._makeEditable();
      var option = $('#select_example').val().split(':');
      var scope = option[0];
      var index = option[1];
      
      var op = SUBSTANCE_COMMANDS[scope][index];
      $('#command').val(JSON.stringify(op.op, null, '  '));
      return false;
    },

    _applyOperation: function(e) {
      if (!$(e.currentTarget).hasClass('active')) return;
      var op = JSON.parse(this.$('#command').val());

      this.model.apply(op, {
        user: "demo"
      });

      this.sha = this.model.getRef('master', 'head');

      this.render();
      return false;
    },

    _checkoutOperation: function(e) {
      var sha = $(e.currentTarget).attr('data-sha');
      // Checkout previous version
      this.model.checkout(sha);

      this.model.setRef('head', sha);

      this.sha = sha;
      this.render(); // Re-render it
      return false;
    },

    initialize: function (options) {
      this.sha = this.model.getRef('head');
      this.scope = 'document';
    },

    // Toggle Start view
    start: function() {
      
    },

    // Render application template
    render: function() {

      var last = this.model.getRef('last') || this.model.getRef('head');
      var that = this;
      var commits = this.model.getCommits(last);

      this.$el.html(_.tpl('document', {
        sha: this.sha,
        operations: commits,
        nodes: _.map(this.model.lists.content, function(n) { return that.model.nodes[n];}),
        document: this.model
      }));

      // Get current op
      var op = this.model.commits[this.sha];
      
      if (op) $('#command').val(JSON.stringify(op.op, null, '  '));
      this.renderAnnotations();
      this.renderScope();
    },

    renderAnnotations: function() {
      var that = this;
      _.each(this.model.lists.content, function(nodeId) {
        var node = that.model.nodes[nodeId];
        var annotations = that.model.find('annotations', node.id);
        _.each(annotations, function(a) {
          var elems = $('div[data-id="'+a.node+'"]').children().slice(a.pos[0], a.pos[0] + a.pos[1]);
          elems.addClass(a.type);
        });
      });
    },

    renderScope: function() {
      this.$('#scope').html(_.tpl('scope', {
        scope: this.scope,
        commands: SUBSTANCE_COMMANDS
      }));
    }
  });

  
  window.app = new Application({el: '#container'});

  // Start responding to routes
  window.router = new Router({});

  Backbone.history.start();
});


// Global stuff
// ---------------

var store;

function loadDocument(user, doc, cb) {
  env = Substance.env || "";

  store = new Substance.RedisStore({
    scope: env+":"+user
  });

  if (doc.indexOf('json')>=0) {
    $.getJSON('../data/' + doc, function(rawDoc) {
      cb(null, rawDoc);
    });
  } else {
    store.get(doc, cb);
  }
}


// Update doc (docstore.update)
// -----------------

// function updateDoc(doc, commit, cb) {
//   store.update(doc.id, [commit], function(err) {
//     store.setSnapshot(doc.id, doc.content, 'master', 'head', function(err) {
//       // Update metadata accordingly
//       if (commit.op[0] === "set") {
//         _.extend(doc.meta, doc.content.properties);
//         updateMeta(doc, cb);
//       };
//     });
//   });
// };

// Update doc (docstore.setRef)
// -----------------

// function updateRef(doc, ref, sha, cb) {
//   // TODO: provisionally branch hard coded
//   var refs = {}
//   refs[ref] = sha;
//   store.setRefs(doc.id, 'master', refs, cb); //  = function(id, ref, sha, cb) {
// };
