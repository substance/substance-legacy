sc.views.Editor = Dance.Performer.extend({

  // Events
  // ------

  events: {
    'click .toggle.settings': 'toggleSettings',
    'click .toggle.collaborators': 'toggleCollaborators',
    'click .toggle.export': 'toggleExport'
  },

  // Handlers
  // --------

  initialize: function() {
    // Setup shelf views
    this.settings      = new sc.views.Settings({ model: this.model, authorized: this.authorized });
    this.collaborators = new sc.views.Collaborators({ model: this.model, docView: this, authorized: this.authorized });
    this["export"]     = new sc.views.Export({ model: this.model, authorized: this.authorized });
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

  render: function () {
    this.$el.html(_.tpl('editor', {}));

    this.composer = new Substance.Composer({el: '#document_wrapper', model: this.model });
    this.composer.render();
    return this;
  }
});