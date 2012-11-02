sc.views.Comments = Dance.Performer.extend({

  // Events
  // ------

  events: {
    'click .insert-comment': '_insertComment',
    'click .close-issue': '_closeIssue',
    'click .comment-scope': '_toggleScope'
  },

  // Handlers
  // --------

  _insertComment: function(e) {
    var node = this.$('.comment-scope.active').attr('data-node');
    var annotation = this.$('.comment-scope.active').attr('data-annotation');
    var content = $(e.currentTarget).parent().find('.comment-content').val();

    this.model.document.apply(["insert", {
      id: "comment:"+Math.uuid(),
      content: content,
      node: node,
      annotation: annotation,
      created_at: new Date().toJSON(),
      user: app.user
    }], {scope: "comment"});

    // Not too smart™
    this.model.comments.compute();
    this.render();
    return false;
  },

  _closeIssue: function() {
    var node = this.$('.comment-scope.active').attr('data-node');
    var annotation = this.$('.comment-scope.active').attr('data-annotation');

    this.model.document.apply(["delete", {
      id: annotation
    }], {scope: "annotation"});

    this.model.comments.compute();
    this.render();
    this.activateScope('node_comments');
    
    // Notify Surface
    choreographer.trigger('annotation:deleted', node, annotation);
    return false;
  },

  _toggleScope: function(e) {
    var node = $(e.currentTarget).attr('data-node');
    var annotation = $(e.currentTarget).attr('data-annotation');
    var scope = $(e.currentTarget).attr('id');

    // Notify Surface
    choreographer.trigger('comment-scope:selected', scope, node, annotation);
  },

  activateScope: function(scope) {
    // console.log('activating scope should not happen twice', scope);
    if (!scope) return; // Skip, since already active
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
    choreographer.off('comment-scope:selected', this.activateScope);
    choreographer.on('comment-scope:selected', this.activateScope, this);

    // Listing to comments:updated event on session
    this.model.off('comments:updated', this.render);
    this.model.on('comments:updated', this.render, this);
  },

  render: function () {
    this.$el.html(_.tpl('comments', this.model));
    this.activateScope(this.scope);
    return this;
  }
});