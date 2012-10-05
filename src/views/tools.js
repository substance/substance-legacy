sc.views.DocumentTool = Dance.Performer.extend({

  // Events
  // ------

  events: {
    'click .toggle-tool': '_toggleTool'
  },

  _toggleTool: function(e) {
    var viewName = $(e.currentTarget).attr('data-view');
    this.views.tool = new sc.views[viewName]({model: this.model});
    this.$('.tool').html(this.views.tool.render().el);
    $('.navigation .toggle-tool').removeClass('active');
    $(e.currentTarget).addClass('active');
    return;
  },

  // Handlers
  // --------

  initialize: function(options) {
    this.documentView = options.documentView;

    // Views
    this.views = {};

    this.views.tool = new sc.views.Comments({model: this.model});
  },

  render: function() {
    this.$el.html(_.tpl('tools', this.model));
    this.$('.tool').html(this.views.tool.render().el);
    return this;
  }
});

sc.views.Tools = Dance.Performer.extend({

  // Events
  // ------

  events: {
    'click .toggle-tool': '_toggleTool'
  },

  _toggleTool: function(e) {
    this.view = $(e.currentTarget).attr('data-view');

    this.update();
    return false;
  },

  // Handlers
  // --------

  initialize: function(options) {
    this.documentView = options.documentView;

    // Views
    this.views = {};

    // Default View
    this.view = 'comments';
    this.comments();
  },

  // Toggle document outline
  outline: function() {
    this.views.tool = new sc.views.Outline({model: this.model});
  },

  // Toggle patches view
  patches: function() {
    this.views.tool = new sc.views.Patches({model: this.model});
  },

  // Toggle document history
  history: function() {
    this.views.tool = new sc.views.History({model: this.model});
  },

  // Toggle comments
  comments: function() {
    this.views.tool = new sc.views.Comments({
      model: getComments(this.model.document, this.model.node())
    });
  },

  // Update tool state (e.g. if the selection has changed)
  update: function() {
    // TODO: be somewhat smarter with re-rendering
    this[this.view]();
    this.render();
  },

  render: function() {
    this.$el.html(_.tpl('tools', _.extend(this.model, {view: this.view})));
    this.$('.tool').html(this.views.tool.render().el);
    return this;
  }
});