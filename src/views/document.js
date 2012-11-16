sc.views.Document = Dance.Performer.extend({
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

    this.model.document.on('operation:applied', function(operation) {
      switch(operation[0]) {
        case "move": that.move(operation[1]); break;
        case "insert": that.insert(operation[1]); break;
        case "update": that.update(operation[1]); break;
        case "delete": that.delete(operation[1]); break;
      }
    });

    // Handlers

    function highlightAnnotation(scope, node, annotation) {
      var node = this.nodes[node];
      if (node && node.surface) {
        node.surface.highlight(annotation);
      }
    }

    function deleteAnnotation(node, annotation) {
      var node = this.nodes[node];
      if (node && node.surface) node.surface.deleteAnnotation(annotation);
    }

    function updateNode(node) {
      // Update node since its dirty
      var node = this.nodes[node];
      node.render();
      this.updateSelections();
    }

    // Bind handlers (but only once)
    choreographer.off('comment-scope:selected', highlightAnnotation);
    choreographer.on('comment-scope:selected', highlightAnnotation, this);

    choreographer.off('annotation:deleted', deleteAnnotation);
    choreographer.on('annotation:deleted', deleteAnnotation, this);

    choreographer.off('node:dirty', updateNode);
    choreographer.on('node:dirty', updateNode, this);
    
    this.model.off('node:selected', this.updateSelections);
    this.model.on('node:selected', this.updateSelections, this);
    this.build();

    $(document.body).keydown(this.onKeydown);
  },

  // Get a particular node by id
  getNode: function(id) {
    return this.model.document.content.nodes[id];
  },

  insert: function(options) {
    var node = this.getNode(options.id);
    var view = this.createNodeView(node);

    this.nodes[node.id] = view;
    
    var newEl = $(view.render().el);
    if (options.target) {
      newEl.insertAfter($('#'+_.htmlId(options.target)));  
    } else {
      this.$('.nodes').append(newEl)
    }
    newEl.click();
    newEl.find('.content').focus();
  },

  // Node content has been updated
  update: function(options) {
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
    }, this);
    this.model.select([]);
  },

  build: function() {
    this.nodes = {};
    this.model.document.list(function(node) {
      this.nodes[node.id] = this.createNodeView(node);
    }, this);
  },

  // UI updates
  // --------

  insertNode: function(type, options) {
    var selection = this.model.users[this.model.user].selection;
    var target = _.last(selection);

    var properties = {};

    properties["content"] = options.content || "";

    // console.log('insörting');

    this.model.document.apply(["insert", {
      "id": type+":"+Math.uuid(),
      "type": type,
      "target": target,
      "data": properties
    }], {
      user: this.model.user  
    });
  },

  deleteNodes: function() {
    this.model.document.apply(["delete", {
      "nodes": this.model.selection()
    }], {
      user: this.model.user
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
      node_types: [
        {name: "Heading", type: "heading"},
        {name: "Text", type: "text"}
      ]
    }));
  },

  // Updates the current selection
  updateSelections: function(selections) {
    // $('.content-node.selected .handle').css('background', '');
    $('.content-node .down').hide();
    $('.content-node .up').hide();
    $('.content-node .delete').hide();
    $('.content-node.selected').removeClass('selected');


    this.updateMode();
    
    _.each(this.model.selections, function(user, node) {
      $('#'+_.htmlId(node)).addClass('selected')
        // .find('.handle').css('background', this.model.users[user].color);
    }, this);

    $('.content-node.selected').first().find('.up').show();
    $('.content-node.selected').first().find('.delete').show();
    $('.content-node.selected').last().find('.down').show();
  },

  // Issue commands
  // --------

  selectNext: function() {
    var selection = this.model.users[this.model.user].selection;
    var head = this.model.document.content.head;
    var tail = this.model.document.content.tail;
    if (selection.length === 0) return this.model.select([head]);
    var next = this.getNode(_.last(selection)).next;
    this.model.select(next ? [next] : [tail]);
  },

  selectPrev: function() {
    var selection = this.model.users[this.model.user].selection;
    var head = this.model.document.content.head;
    var tail = this.model.document.content.tail;
    if (selection.length === 0) return this.model.select([tail]);
    var prev = this.getNode(_.first(selection)).prev;
    this.model.select(prev ? [prev] : [head]);
  },

  expandSelection: function() {
    var lastnode = _.last(this.model.users[this.model.user].selection);
    if (lastnode) {
      var next = this.model.document.content.nodes[lastnode].next;
      if (next) {
        this.model.select(this.model.users[this.model.user].selection.concat([next]));
      }
    }
  },

  narrowSelection: function() {
    var selection = this.model.users[this.model.user].selection;
    this.model.select(_.clone(selection).splice(0, selection.length-1));
  },

  moveDown: function() {
    var selection = this.model.users[this.model.user].selection;
    var last = this.getNode(_.last(selection));

    if (last.next) {
      this.model.document.apply(["move", {
        "nodes": selection, "target": last.next
      }], {
        user: this.model.user
      });
    }
  },

  moveUp: function() {
    var selection = this.model.users[this.model.user].selection;
    var first = this.getNode(_.first(selection));

    if (first.prev) { 
      var target = this.model.document.content.head === first.prev ? 'front' : this.getNode(first.prev).prev;
      this.model.document.apply(["move", {
        "nodes": selection, "target": target
      }], {
        user: this.model.user
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

  select: function (e) {
    // Skip when move handle has been clicked
    if ($(e.target).hasClass('move')) return;

    var id = $(e.currentTarget)[0].id.replace(/_/g, ":");
    this.model.select([id]);
  },

  initSurface: function(property) {
    var that = this;

    this.surface = new Substance.Surface({
      el: this.$('.document-'+property)[0],
      content: that.model.document.content.properties[property]
    });

    // Events
    // ------

    this.surface.on('content:changed', function(content, prevContent) {
      var delta = _.extractOperation(prevContent, content);

      console.log("Partial Text Update", delta);

      var opts = {};
      opts[property] = delta;

      that.model.document.apply(["set", opts]);
    });
  },

  // Initial render of all nodes
  render: function () {
    this.$el.html(_.tpl('document', this.model));

    // Init editor for document abstract and title
    this.initSurface("abstract");
    this.initSurface("title");

    this.model.document.list(function(node) {
      $(this.nodes[node.id].render().el).appendTo(this.$('.nodes'));
    }, this);
    return this;
  }
});