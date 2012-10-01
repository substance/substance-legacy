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
    var comment = this.model.document.annotations.content.nodes[id];
    
    function highlight() {
      unhighlight();
      $(e.currentTarget).addClass('active');

      // Highlight comment toggles in document
      _.each(comment.nodes, function(n) {
        $('#'+_.htmlId(n)+" .comments-toggle").addClass('highlighted');
      });
    }

    function unhighlight() {
      $(e.currentTarget).parent().find('.comment').removeClass('active');
      $('.content-node .comments-toggle').removeClass('highlighted');
    }

    // Highlight or unhighlight?
    $(e.currentTarget).hasClass('active') ? unhighlight() : highlight();

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
      op: ["insert", {"id": "annotation:"+Math.uuid(), "type": "comment", "data": properties}],
      user: "michael",
    };

    this.model.document.annotations.apply(op);
    this.render();
    return false;
  },

  initialize: function(options) {
    this.documentView = options.documentView;
  },

  comments: function(marker) {
    var comments = [];

    _.each(this.model.document.annotations.nodes(), function(annotation) {
      if (annotation.type === "comment" && ((!marker && !annotation.marker) || (marker && annotation.marker === marker))) {
        console.log(annotation);
      }
    });
    
    return comments;
  },

  markers: function() {
    var node = this.model.node();

    var markers = [];
    if (!node) {
      markers.push({
        name: "Document",
        comments: this.comments()
      });
    }

    _.each(this.model.document.annotations.nodes(), function(annotation) {
      if (_.include(["mark-1", "mark-2", "mark-3"], annotation.type) && annotation.node === node) {
        markers.push({
          name: annotation.id,
          comments: []
        });
      }

    });
    return markers;
  },

  render: function () {
    this.$el.html(_.tpl('comments', {
      markers: this.markers(),
    }));
    return this;
  }
});