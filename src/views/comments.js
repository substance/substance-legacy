sc.views.Comments = Dance.Performer.extend({

  // Events
  // ------

  events: {
    'click .insert-comment': '_insertComment',
    'click .comment': '_showComment',
    'click .comment-category .header': '_toggleCategory'
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

  _insertComment: function(e) {
    var node = $(e.currentTarget).parent().parent().parent().attr('data-node');
    var annotation = $(e.currentTarget).parent().parent().parent().attr('data-annotation');
    var content = $(e.currentTarget).parent().find('.comment-content').val();

    // console.log($(e.currentTarget));
    // console.log('node', node);
    // console.log('annotation', annotation);
    // console.log('content to be inserted:', content);

    this.model.document.apply(["insert", {
      id: "comment:"+Math.uuid(),
      content: content,
      node: node,
      annotation: annotation
    }], {scope: "comment"});

    this.render();

    return false;
  },

  _toggleCategory: function(e) {
    var category = $(e.currentTarget).parent().attr('data-category');
    this.activateCategory(category);
  },

  activateCategory: function(category) {
    if (!category) return; // Skip, since already active
    // console.log('activating category view...', category);
    this.category = category;
    // console.log(this.category);
    this.$('.comment-category').removeClass('active');
    this.$('#'+_.htmlId(category)).addClass('active');
  },

  initialize: function(options) {
    this.documentView = options.documentView;
  },

  categories: function() {
    var node = this.model.node();
    var categories = [];
    var that = this;

    if (!node) {
      categories.push({
        name: "Document",
        type: "document",
        category: "document_comments",
        comments: this.model.document.getDocumentComments()
      });
    } else {
      categories.push({
        name: "Le Node",
        type: "node",
        category: "node_comments",
        comments: this.model.document.getNodeComments(node)
      });
    }

    // Extract annotation text from the model
    function annotationText(a) {
      var content = that.model.document.content.nodes[a.node].content;
      if (!a.pos) return "No pos";
      return content.substr(a.pos[0], a.pos[1]);
    }

    var annotations = this.model.document.getAnnotations(node);
    _.each(annotations, function(a) {
      categories.push({
        name: annotationText(a),
        type: a.type,
        annotation: a.id,
        category: a.id,
        comments: this.model.document.getCommentsForAnnotation(a.id)
      });
    }, this);
    return categories;
  },

  render: function () {
    this.$el.html(_.tpl('comments', {
      node: this.model.node(),
      categories: this.categories()
    }));
    this.activateCategory(this.category);
    return this;
  }
});