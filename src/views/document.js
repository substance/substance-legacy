sc.views.Document = Substance.View.extend({
  id: 'document',

  // Events
  // ------

  events: {
    'click .content-node': 'select',
    'click .comments-toggle': function(e) {
      e.preventDefault();
    }
  },

  // Handlers
  // --------

  initialize: function(options) {
    var that = this;

    // Delegate update operations
    this.model.document.on('commit:applied', function(commit) {
      switch(commit.op[0]) {
        case "move": that.move(commit.op[1]); break;
        case "insert": that.insert(commit.op[1]); break;
        case "update": that.update(commit.op[1]); break;
        case "set": that.set(commit.op[1]); break;
        case "delete": that.delete(commit.op[1]); break;
      }
    });

    // Handlers
    function highlightAnnotation(scope, node, annotation) {
      var node = this.nodes[node];
      if (node && node.surface) {
        node.surface.highlight(annotation);
      }
    }

    // Delete Annotation
    function deleteAnnotation(node, annotation) {
      var node = this.nodes[node];
      if (node && node.surface) node.surface.deleteAnnotation(annotation);
    }

    // Update Node
    function updateNode(nodeId) {
      // Update node since its dirty
      var node = this.nodes[nodeId];

      // TypeError: 'undefined' is not an object (evaluating 'node.render')
      if (!node) console.log('ERROR Spottid', nodeId, ' not found');
      if (node) node.render();
      this.updateSelections();
    }

    // Bind handlers (but only once)
    router.off('comment-scope:selected', highlightAnnotation);
    router.on('comment-scope:selected', highlightAnnotation, this);

    router.off('annotation:deleted', deleteAnnotation);
    router.on('annotation:deleted', deleteAnnotation, this);

    router.off('node:dirty', updateNode);
    router.on('node:dirty', updateNode, this);

    this.model.off('node:selected', this.updateSelections);
    this.model.on('node:selected', this.updateSelections, this);
    this.build();

    $(document.body).keydown(this.onKeydown);
  },

  handleFileSelect: function(evt) {
    var that = this;
    evt.stopPropagation();
    evt.preventDefault();

    // from an input element
    var filesToUpload = evt.target.files;
    var file = filesToUpload[0];

    // this.message('Processing Image ...');

    // TODO: display error message
    if (!file.type.match('image.*')) return /*this.message('Not an image. Skipping ...')*/;

    var img = document.createElement("img");
    var reader = new FileReader();

    reader.onload = function(e) {
      img.src = e.target.result;
      var largeImage = img.src;

      _.delay(function() {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var MAX_WIDTH = 2000;
        var MAX_HEIGHT = 3000;
        var width = img.width;
        var height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        var mediumImage = canvas.toDataURL("image/png");

        var mediumImageId = Substance.util.uuid();
        var largeImageId = Substance.util.uuid();


        if (!session.localStore.createBlob(that.model.document.id, mediumImageId, mediumImage) ||
            !session.localStore.createBlob(that.model.document.id, largeImageId, largeImage)) {
          throw new Substance.errors.Error('Storing images failed');
        }

        that.model.document.apply(["set", {
          "cover_medium": mediumImageId,
          "cover_large": largeImageId,
        }]);

        that.render(); // re-render the shit out of it

      }, 800);
    }

    reader.readAsDataURL(file);
  },

  bindFileEvents: function() {
    var that = this;
    _.delay(function() {
      that.$('.cover-file').bind('change', function(e) {
        that.handleFileSelect(e);
      });
    }, 200);
  },

  // Get a particular node by id
  getNode: function(id) {
    return this.model.document.nodes[id];
  },

  set: function(options) {
    this.initSurface("abstract");
    this.initSurface("title");
  },

  insert: function(options) {
    var node = this.getNode(options.id);

    var types = this.model.document.getTypes(node.type);
    if (types[0] !== "content") return; // skip non-content nodes

    var view = this.createNodeView(node);

    this.nodes[node.id] = view;

    var newEl = $(view.render().el);
    if (options.target && options.target !== "back") {
      newEl.insertAfter($('#'+_.htmlId(options.target)));
    } else {
      this.$('.nodes').append(newEl)
    }
    newEl.click();
    newEl.find('.content').focus();
  },

  // Node content has been updated
  update: function(options) {
    var types = this.model.document.getTypes(this.getNode(options.id).type);
    if (types[0] !== "content") return; // skip non-content nodes

    var node = this.nodes[options.id];

    // Only rerender if not update comes from outside
    if (this.model.node() !== options.id) {
      node.render();
    }
  },

  // Nodes have been deleted
  delete: function(options) {
    _.each(options.nodes, function(node) {
      this.$('#'+_.htmlId(node)).remove();
      // var view = this.nodes[node];
      // view.dispose();
      // delete this.nodes[node];
    }, this);
    this.model.select([]);
  },

  build: function() {
    this.nodes = {};
    this.model.document.each(function(node) {
      this.nodes[node.id] = this.createNodeView(node);
    }, this);
  },

  // UI updates
  // --------

  insertNode: function(type, options) {
    var selection = this.model.users[this.model.user()].selection;
    var target = options.target || _.last(selection) || 'back';
    var properties = {};

    properties["content"] = options.content || "";

    if (type === "heading") properties["level"] = 1;

    this.model.document.apply(["insert", {
      "id": Substance.util.uuid(type+':', 8),
      "type": type,
      "target": target,
      "data": properties
    }]);
  },

  deleteNodes: function() {
    this.model.document.apply(["delete", {
      "nodes": this.model.selection()
    }], {
      user: this.model.user()
    });
  },

  updateNode: function(node, properties) {
    this.nodes[node].update(properties);
  },

  // Incoming move node operation
  move: function(options) {
    var $selection = $(_.map(options.nodes, function(n) { return '#'+_.htmlId(n); }).join(', '));
    if (options.target === "front") {
      $selection.insertBefore($('#document .content-node').first());
    } else {
      $selection.insertAfter($('#'+_.htmlId(options.target)));
    }
  },

  // Set the right mode
  // REWORK
  updateMode: function() {
    var selection = this.model.selection();
    $('#document').removeClass();

    if (selection.length) {
      $('#document').addClass(this.model.edit ? 'edit-mode' : 'structure-mode');
    } else {
      $('#document').addClass('document-mode');
    }

    // Render context bar
    this.$('#context_bar').html(_.tpl('context_bar', {
      level: this.model.level(),
      // TODO: Use Plugin System!
      node_types: [
        { name: "Heading", type: "heading" },
        { name: "Text", type: "text" },
        { name: "Code", type: "code" },
        { name: "Image", type: "image" }
      ]
    }));
  },

  // Updates the current selection
  updateSelections: function(selections) {
    $('.content-node .down').hide();
    $('.content-node .up').hide();
    $('.content-node .delete').hide();
    $('.content-node.selected').removeClass('selected');

    // HACK: ensures there are no remaining floating annotation controls
    $('.annotation-tools').hide();

    this.updateMode();

    _.each(this.model.selections, function(user, node) {
      $('#'+_.htmlId(node)).addClass('selected')
    }, this);

    $('.content-node.selected').first().find('.up').show();
    $('.content-node.selected').first().find('.delete').show();
    $('.content-node.selected').last().find('.down').show();
  },

  // Issue commands
  // --------

  selectNext: function() {
    var selection = this.model.users[this.model.user()].selection;
    var doc = this.model.document;
    if (selection.length === 0) return this.model.select([_.first(doc.views.content)]);
    var next = doc.getSuccessor(_.last(selection));
    if (next) return this.model.select([next]);
  },

  selectPrev: function() {
    var selection = this.model.users[this.model.user()].selection;
    var doc = this.model.document;
    if (selection.length === 0) return this.model.select([_.last(doc.views.content)]);
    var prev = doc.getPredecessor(_.first(selection));
    return this.model.select(prev ? [prev] : [_.first(doc.views.content)]);
  },

  expandSelection: function() {
    var selection = this.model.users[this.model.user()].selection;
    var lastnode = _.last(selection);
    var doc = this.model.document;

    if (lastnode) {
      var next = doc.getSuccessor(lastnode);
      if (next) {
        this.model.select(selection.concat([next]));
      }
    }
  },

  narrowSelection: function() {
    var selection = this.model.users[this.model.user()].selection;
    this.model.select(_.clone(selection).splice(0, selection.length-1));
  },

  moveDown: function() {
    var selection = this.model.users[this.model.user()].selection;
    var last = this.getNode(_.last(selection));
    var successor = this.model.document.getSuccessor(last.id);

    if (successor) {
      this.model.document.apply(["move", {
        "nodes": selection, "target": successor
      }], {
        user: this.model.user()
      });
    }
  },

  moveUp: function() {
    var selection = this.model.users[this.model.user()].selection;
    var first = this.getNode(_.first(selection));
    var doc = this.model.document;

    var pos = doc.position(first.id);
    var pred = doc.getPredecessor(first.id);

    pred = doc.getPredecessor(pred);
    if (pred || pos === 1) {
      // If first selected node is at index 1 move selection to front
      var target = pos === 1 ? 'front' : pred;
      doc.apply(["move", {
        "nodes": selection, "target": target
      }], {
        user: this.model.user()
      });
    }
  },

  createNodeView: function(node) {
    return sc.views.Node.create({
      session: this.model,
      document: this.model.document,
      model: node
    });
  },

  select: function(e) {
    // Skip when move handle has been clicked
    if ($(e.target).hasClass('move')) return;
    var id = $(e.currentTarget)[0].id.replace(/_/g, ":");
    this.model.select([id]);
  },

  initSurface: function(property) {
    var that = this;
    this.surface = new Substance.Surface({
      el: this.$('.document-'+property)[0],
      content: that.model.document.properties[property]
    });

    // Events
    // ------

    this.surface.on('content:changed', function(content, prevContent) {
      var delta = _.extractOperation(prevContent, content);
      var opts = {};
      opts[property] = delta;
      that.model.document.apply(["set", opts]);
    });
  },

  // Initial render of all nodes
  render: function() {
    var that = this;
    var doc = that.model.document;

    var coverLarge = doc.store.getBlob(doc.properties.cover_large);
    var coverMedium = doc.store.getBlob(doc.properties.cover_medium);

    that.$el.html(_.tpl('document', {
      document: that.model.document,
      cover_large: coverLarge,
      cover_medium: coverMedium
    }));

    // Init editor for document abstract and title
    that.initSurface("abstract");
    that.initSurface("title");

    that.model.document.each(function(node) {
      $(that.nodes[node.id].render().el).appendTo(that.$('.nodes'));
    }, that);
    that.bindFileEvents();
  },

  dispose: function() {
    console.log('disposing document view');
    this.disposeBindings();
    _.each(this.nodes, function(node) {
      node.dispose();
    });
  }

});