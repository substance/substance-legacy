sc.views.Comments = Dance.Performer.extend({

  // Events
  // ------

  events: {
    'click .insert-comment': '_insertComment',
    'click .comment': '_showComment'
  },

  // Handlers
  // --------

  _showComment: function(e) {
    var id = $(e.currentTarget).attr('data-id');
    
    $(e.currentTarget).parent().find('.comment').removeClass('active');
    $(e.currentTarget).addClass('active');
    var comment = this.model.document.annotations.content.nodes[id];
    return false;
  },

  _insertComment: function() {
    var selection = this.model.selection(),
        properties = {
          "content": $('#comment_content').val(),
          "nodes": selection
        };

    // TODO get pos from surface if there is one
    if (selection.length === 1) { // && isTextNode?
      // selectedNode = this.model.document.content.nodes[selection[0]];
      properties.pos = [0,4];
    }

    var op = {
      op: ["insert", {"id": "annotation:"+Math.uuid(), "type": "comment", "properties": properties}],
      user: "michael",
    };

    this.model.document.annotations.apply(op);
    this.render();
    return false;
  },

  initialize: function(options) {
    this.documentView = options.documentView;
  },

  comments: function() {
    var that = this;

    return _.filter(this.model.document.annotations.nodes(), function(annotation) {
      if (annotation.type !== "comment") return false;
      if (that.model.selection().length === 0) return true;
      return _.intersection(that.model.selection(), annotation.nodes).length > 0;
    });
  },

  render: function () {
    this.$el.html(_.tpl('comments', {
      comments: this.comments()
    }));
    return this;
  }
});