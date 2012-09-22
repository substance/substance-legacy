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

  initialize: function (options) {

    var that = this;

    this.model.document.on('operation:applied', function(operation) {
      switch(operation.op[0]) {
        case "move": that.move(operation.op[1]); break;
        case "insert": that.insert(operation.op[1]); break;
        case "update": that.update(operation.op[1]); break;
        case "delete": that.delete(operation.op[1]); break;
      }
    });

    this.model.document.annotations.on('operation:applied', function(operation) {
      switch(operation.op[0]) {
        case "move": that.moveAnnotation(operation.op[1]); break;
        case "insert": that.insertAnnotation(operation.op[1]); break;
        case "update": that.updateAnnotation(operation.op[1]); break;
        case "delete": that.deleteAnnotation(operation.op[1]); break;
      }
    });

    this.model.on('node:select', this.updateSelections, this);
    this.build();

    $(document.body).keydown(this.onKeydown);
  },

  // Handle annotation updates
  moveAnnotation: function() {

  },

  updateAnnotation: function() {

  },

  insertAnnotation: function(options) {
    _.each(options.properties.nodes, function(node) {
      this.nodes[node].render(true); // Re-render affected node
      this.updateSelections();
    }, this);
  },

  deleteAnnotation: function() {

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
    newEl.insertAfter($('#'+_.htmlId(options.target)));

    newEl.click();
    newEl.contents().focus();
  },

  // Node content has been updated
  update: function(options) {
    var node = this.nodes[options.id];
    node.render(); // Re-render that updated node
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

    this.model.document.apply({
      op: ["insert", {
        "id": type+":"+Math.uuid(),
        "type": type,
        "target": target,
        "properties": properties
      }],
      user: this.model.user
    });
  },

  deleteNodes: function() {
    this.model.document.apply({
      op: ["delete", {"nodes": this.model.selection() }],
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
  },

  // Updates the current selection
  updateSelections: function(selections) {
    $('.content-node.selected .handle').css('background', '');
    $('.content-node.selected').removeClass('selected');

    this.updateMode();
    
    _.each(this.model.selections, function(user, node) {
      $('#'+_.htmlId(node)).addClass('selected')
        .find('.handle').css('background', this.model.users[user].color);
    }, this);
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
      this.model.document.apply({
        op: ["move", {"nodes": selection, "target": last.next}],
        user: this.model.user
      });
    }
  },

  moveUp: function() {
    var selection = this.model.users[this.model.user].selection;
    var first = this.getNode(_.first(selection));

    if (first.prev) { 
      var target = this.model.document.content.head === first.prev ? 'front' : this.getNode(first.prev).prev;
      this.model.document.apply({
        op: ["move", {"nodes": selection, "target": target}],
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
    var id = $(e.currentTarget)[0].id.replace(/_/g, ":");
    this.model.select([id]);
  },

  // Initial render of all nodes
  render: function () {
    this.$el.html(_.tpl('document', this.model));
    this.model.document.list(function(node) {
      $(this.nodes[node.id].render().el).appendTo(this.$('.nodes'));
    }, this);
    return this;
  }
});