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

    // Not too smart™
    this.model = getComments(this.model.document, this.model.node);

    this.render();

    return false;
  },

  _toggleCategory: function(e) {
    var category = $(e.currentTarget).parent().attr('data-annotation');
    this.activateCategory(category || "node_comments");
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

    // Every time there's a node update (such as text or annotation change)

    choreographer.unbind('node:update');

    choreographer.bind('node:update', function(node) {
      console.log('node updated man!', node);
    });

    // Triggered by Text Node
    choreographer.unbind('comment-category:selected');
    choreographer.bind('comment-category:selected', this.activateCategory, this);
  },

  // Receive new data and update UI incrementally
  // Not called yet
  // update: function(data) {
  //   this.model = data;
  //   this.render();
  // },

  render: function () {
    this.$el.html(_.tpl('comments', this.model));
    this.activateCategory(this.category);
    
    return this;
  }
});