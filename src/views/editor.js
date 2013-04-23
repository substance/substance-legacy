sc.views.Editor = Backbone.View.extend({

  id: 'container',
  // Events
  // ------

  events: {
    'click .toggle.settings': 'toggleSettings',
    'click .toggle.collaborators': 'toggleCollaborators',
    'click .toggle.console': 'toggleConsole',
    'click .toggle.export': 'toggleExport',
    'click .toggle-publish-settings': 'togglePublishSettings',
    'click a.undo': 'undo',
    'click a.redo': 'redo'
  },

  undo: function() {
    return this.composer.undo();
  },

  redo: function() {
    return this.composer.redo();
  },

  // Handlers
  // --------

  initialize: function() {
    var that = this;

    // Setup shelf views
    this.settings      = new sc.views.Settings({ model: this.model });
    this.collaborators = new sc.views.Collaborators({ model: session, docView: this });
    this["export"]     = new sc.views.Export({ model: this.model });

    // Publish Settings
    this.publishSettings = new sc.views.PublishSettings({ model: session });

    // Refresh publish state on demand
    this.publishSettings.on('publish_state:updated', function() {
      that.updatePublishState();
    });
  },

  renderPublishSettings: function() {
    this.publishSettings.render();
  },

  togglePublishSettings: function() {
    var that = this;

    this.$('.publish-settings').toggle();

    var documentId = this.model.document.id;

    // Triggers a re-render
    session.loadPublications(function(err) {
      that.renderPublishSettings();
    });
    
    return false;
  },

  hidePublishSettings: function() {
    this.$('.publish-settings').hide();
  },

  toggleSettings:      function (e) { this.toggleView('settings'); return false; },
  toggleCollaborators: function (e) {
    var that = this;
    session.loadCollaborators(function(err, collaborators) {
      that.toggleView('collaborators');
    });
    return false;
  },
  toggleConsole: function (e) {
    var that = this;
    // session.loadCollaborators(function(err, collaborators) {
    //   that.toggleView('collaborators');
    // });
    that.toggleView('console');
    
    return false;
  },
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

  updateMessage: function() {
    var state = this.model.publishState();
    var doc = this.model.document;

    if (state === 'published') {
      this.$('.publish-state .message').html($.timeago(doc.meta.published_at));
    }
  },

  updatePublishState: function() {
    var state = this.model.publishState();
    var doc = this.model.document;

    this.$('.publish-state')
      .removeClass('published unpublished dirty')
      .addClass(state);

    this.$('.publish-state .state').html(state !== 'unpublished' ? 'Published' : state);

    if (state !== 'unpublished') {
      this.$('.view-online').removeClass('hidden');
    } else {
      this.$('.view-online').addClass('hidden');
    }

    var message = "Private document";
    if (state === "published") message = $.timeago(doc.meta.published_at);
    if (state === "dirty") message = "Pending changes";
    
    this.$('.publish-state .message').html(message);

    this.hidePublishSettings();

    // this.$('.publish-actions').empty();

    // if (state === "unpublished") {
    //   this.$('.publish-actions').append('<a href="#" class="publish-document"><div class="icon"></div>Publish</a>');
    // }

    // if (state === "dirty") {
    //   this.$('.publish-actions').append('<a href="#" class="publish-document"><div class="icon"></div>Publish Changes</a>');
    // }

    // if (state !== "unpublished") {
    //   this.$('.publish-actions').append('<a href="#" class="unpublish-document"><div class="icon"></div>Unpublish</a>');
    // }

    // this.$('.publish-state .publish-settings').hide();
  },

  render: function () {
    var that = this;
    this.$el.html(_.tpl('editor', {
      session: this.model,
      doc: this.model.document
    }));

    // Initial render of publish settings (empty)
    this.$('.publish-settings').html(this.publishSettings.render().el);

    // TODO: deconstructor-ish thing for clearing the interval when the view is no longer
    clearInterval(window.leInterval);
    window.leInterval = setInterval(function(){
      that.updateMessage();
    }, 1000);

    this.updatePublishState();

    this.composer = new Substance.Composer({id: 'document_wrapper', model: this.model });
    this.$('#document_wrapper').replaceWith(this.composer.render().el);

    return this;
  }
});