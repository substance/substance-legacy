sc.views.Editor = Dance.Performer.extend({

  id: 'container',
  // Events
  // ------

  events: {
    'click .toggle.settings': 'toggleSettings',
    'click .toggle.collaborators': 'toggleCollaborators',
    'click .toggle.export': 'toggleExport',
    'click .toggle-publish-actions': 'togglePublishActions',
    'click a.delete-document': '_deleteDocument',
    'click a.publish-document ': 'publish',
    'click a.unpublish-document ': 'unpublish'
  },

  publish: function() {
    var that = this;
    this.model.publish(function(err) {
      that.updatePublishState();
    });
    return false;
  },

  unpublish: function() {
    var that = this;
    this.model.unpublish(function(err) {
      that.updatePublishState();
    });
    return false;
  },

  _deleteDocument: function() {
    store.delete(this.model.document.id, function() {
      choreographer.navigate('/', true);
    });
    return false;
  },

  // Handlers
  // --------

  initialize: function() {
    // Setup shelf views
    this.settings      = new sc.views.Settings({ model: this.model, authorized: this.authorized });
    this.collaborators = new sc.views.Collaborators({ model: this.model, docView: this, authorized: this.authorized });
    this["export"]     = new sc.views.Export({ model: this.model, authorized: this.authorized });
  },

  togglePublishActions: function() {
    this.$('.publish-actions').toggle();
    return false;
  },

  toggleSettings:      function (e) { this.toggleView('settings'); return false; },
  toggleCollaborators: function (e) { this.toggleView('collaborators'); return false; },
  toggleExport:        function (e) { this.toggleView('export'); return false; },

  resizeShelf: function () {
    var shelfHeight   = this.currentView ? $(this.currentView.el).outerHeight() : 0,
        contentMargin = shelfHeight + 110;

    this.$('#document_shelf').css({ height: shelfHeight + 'px' });
    this.$('#document_wrapper').css({ 'margin-top': contentMargin + 'px' });
  },

  closeShelf: function() {
    if (!this.currentView) return;

    // It's important to use detach (not remove) to retain
    // the view's event handlers
    $(this.currentView.el).detach();

    this.currentView = null;
    this.$('.navigation .toggle').removeClass('active');
    this.resizeShelf();
  },

  toggleView: function (viewname) {
    var view = this[viewname];
    var shelf   = this.$('#document_shelf .shelf-content'),
        content = this.$('#document_content');
    
    if (this.currentView && this.currentView === view) return this.closeShelf();
    
    this.$('.navigation .toggle').removeClass('active');
    $('.navigation .toggle.'+viewname).addClass('active');

    shelf.empty();
    shelf.append(view.el);
    this.currentView = view;
    view.render();
    this.resizeShelf();
  },

  updatePublishState: function() {
    var state = this.model.publishState();
    this.$('.publish-state')
      .removeClass('published unpublished dirty')
      .addClass(state);


    this.$('.publish-state .state').html(state === "dirty" ? "Published" : state);
    var message = "Private document";
    if (state === "published") message = $.timeago(this.model.published_at);
    if (state === "dirty") message = "Pending changes";
    this.$('.publish-state .message').html(message);

    state !== "unpublished" ? this.$('.publish-state .unpublish-document').show()
                            : this.$('.publish-state .unpublish-document').hide();

    this.$('.publish-state .publish-actions').hide();

  },

  render: function () {
    this.$el.html(_.tpl('editor', {
      session: this.model
    }));

    this.updatePublishState();

    this.composer = new Substance.Composer({id: 'document_wrapper', model: this.model });
    this.$('#document_wrapper').replaceWith(this.composer.render().el);
    // this.composer.render();
    return this;
  }
});