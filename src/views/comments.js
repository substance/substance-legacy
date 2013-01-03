sc.views.Comments = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click .insert-comment': '_insertComment',
    'click .delete-comment': '_deleteComment',
    'click .close-issue': '_closeIssue',
    'click .comment-scope': '_toggleScope'
  },

  // Handlers
  // --------

  _insertComment: function(e) {
    var node = this.$('.comment-scope.active').attr('data-node');
    var annotation = this.$('.comment-scope.active').attr('data-annotation');
    var content = $(e.currentTarget).parent().find('.comment-content').val();

    if (!node) node = undefined;
    if (!annotation) annotation = undefined;

    this.model.document.apply(["insert_comment", {
      id: "comment:"+Math.uuid(),
      content: content,
      node: node,
      annotation: annotation,
      created_at: new Date().toJSON(),
      user: app.user
    }]);

    // Not too smart™
    this.model.comments.compute(this.scope);
    // this.render(); // compute triggers an event that causes re-render

    // Notify Composer -> triggers a re-render
    if (node) router.trigger('node:dirty', node);
    return false;
  },

  _deleteComment: function(e) {
    var comment = $(e.currentTarget).attr('data-id');

    this.model.document.apply(["delete_comment", { id: comment }]);
    this.model.comments.compute(this.scope);
    return false;
  },

  _closeIssue: function() {
    var node = this.$('.comment-scope.active').attr('data-node');
    var annotation = this.$('.comment-scope.active').attr('data-annotation');

    this.model.document.apply(["delete_annotation", { id: annotation }]);

    this.model.comments.compute();
    // this.render();
    this.activateScope('node_comments');

    // Delete all associated comments
    var comments = this.model.document.commentsForAnnotation(annotation);

    this.model.document.apply(["delete_comment", { nodes: _.pluck(comments, 'id')}]);
    
    // Notify Surface
    router.trigger('annotation:deleted', node, annotation);

    // Notify Composer -> triggers a re-render
    router.trigger('node:dirty', node);
    return false;
  },

  _toggleScope: function(e) {
    var node = $(e.currentTarget).attr('data-node');
    var annotation = $(e.currentTarget).attr('data-annotation');
    var scope = $(e.currentTarget).attr('id');

    // Notify Surface
    router.trigger('comment-scope:selected', scope, node, annotation);
  },

  activateScope: function(scope) {
    // console.log('activating scope should not happen twice', scope);
    if (!scope) return; // TODO: Skip, if already active
    this.scope = scope;
    this.$('.comment-scope').removeClass('active');
    this.$('#'+_.htmlId(scope)).addClass('active');

    this.$('.comments').removeClass('active');
    // Show corresponding comments
    this.$('#comments_'+_.htmlId(scope)).addClass('active');
  },

  initialize: function(options) {
    this.documentView = options.documentView;

    // Initial comments computation
    this.model.comments.compute();

    // Triggered by Text Node
    router.off('comment-scope:selected', this.activateScope);
    router.on('comment-scope:selected', this.activateScope, this);

    // Listing to comments:updated event on session
    this.model.off('comments:updated', this.render);
    this.model.on('comments:updated', this.render, this);
  },

  render: function (scope) {
    // Reset selected scope on every re-render
    this.scope = scope;

    this.$el.html(_.tpl('comments', this.model));
    this.activateScope(this.scope);
    return this;
  }
});