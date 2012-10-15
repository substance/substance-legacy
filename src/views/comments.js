sc.views.Comments = Dance.Performer.extend({

  // Events
  // ------

  events: {
    'click .insert-comment': '_insertComment',
    'click .comment-scope .header': '_toggleScope'
  },

  // Handlers
  // --------

  _insertComment: function(e) {
    var node = $(e.currentTarget).parent().parent().parent().attr('data-node');
    var annotation = $(e.currentTarget).parent().parent().parent().attr('data-annotation');
    var content = $(e.currentTarget).parent().find('.comment-content').val();

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
    var node = $(e.currentTarget).parent().attr('data-node');
    var annotation = $(e.currentTarget).parent().attr('data-annotation');
    var scope = $(e.currentTarget).parent().attr('id');
    choreographer.trigger('comment-scope:selected', scope, node, annotation);
  },

  activateScope: function(scope) {
    console.log('activating scope should not happen twice');
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

    // Triggered by Text Node
    // choreographer.unbind('comment-scope:selected');
    choreographer.bind('comment-scope:selected', this.activateScope, this);

    // Listing to comments:updated event on session
    // this.model.unbind('comments:updated');
    this.model.bind('comments:updated', this.render, this);
  },

  render: function () {
    this.$el.html(_.tpl('comments', this.model));
    this.activateScope(this.scope);
    return this;
  }
});