sc.views.Comments = Dance.Performer.extend({

  // Events
  // ------

  events: {
    'click .insert-comment': '_insertComment',
    // 'click .comment': '_showComment',
    'click .comment-scope .header': '_toggleScope'
  },

  // Handlers
  // --------

  // _showComment: function(e) {
  //   var id = $(e.currentTarget).attr('data-id');

  //   // var comment = this.model.document.annotations.content.nodes[id];
    
  //   // function highlight() {
  //   //   unhighlight();
  //   //   $(e.currentTarget).addClass('active');

  //   //   // Highlight comment toggles in document
  //   //   _.each(comment.nodes, function(n) {
  //   //     $('#'+_.htmlId(n)+" .comments-toggle").addClass('highlighted');
  //   //   });
  //   // }

  //   // function unhighlight() {
  //   //   $(e.currentTarget).parent().find('.comment').removeClass('active');
  //   //   $('.content-node .comments-toggle').removeClass('highlighted');
  //   // }

  //   // Highlight or unhighlight?
  //   // $(e.currentTarget).hasClass('active') ? unhighlight() : highlight();
  //   return false;
  // },

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
    this.model.comments.compute();

    this.render();
    return false;
  },

  _toggleScope: function(e) {
    var scope = $(e.currentTarget).parent().attr('id');
    this.activateScope(scope);
  },

  activateScope: function(scope) {
    if (!scope) return; // Skip, since already active
    this.scope = scope;
    this.$('.comment-scope').removeClass('active');
    this.$('#'+_.htmlId(scope)).addClass('active');

    // TODO: highlight annotation
  },

  initialize: function(options) {
    this.documentView = options.documentView;

    // Initial commentsn computation
    this.model.comments.compute();

    // Every time there's a node update (such as text or annotation change)
    // choreographer.unbind('node:update');

    // choreographer.bind('node:update', function(node) {
    //   console.log('node updated man!', node);
    // });

    // Triggered by Text Node
    choreographer.unbind('comment-scope:selected');
    choreographer.bind('comment-scope:selected', this.activateScope, this);

    // Listing to comments:updated event on session
    this.model.unbind('comments:updated');
    this.model.bind('comments:updated', this.render, this);
  },

  // Receive new comments data from surface
  // update: function(content, annotations) {
  //   this.render();
  // },

  render: function () {
    this.$el.html(_.tpl('comments', this.model));
    this.activateScope(this.scope);
    return this;
  }
});