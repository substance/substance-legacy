// Document
// -------------

s.views.Document = Backbone.View.extend({

  initialize: function (options) {
    _.bindAll(this);
    
    this.authorized  = options.authorized;
    this.published   = options.published;
    this.version     = options.version;
     
    this.node        = s.views.Node.create({ model: this.model });
    this.toc         = new s.views.TOC({ model: this.model });
    this.settings    = new s.views.DocumentSettings({ model: this.model });
    this.publish     = new s.views.Publish({ model: this.model, docView: this });
    this.invite      = new s.views.Invite({ model: this.model });
    this.export      = new s.views.Export({ model: this.model });
    this.subscribers = new s.views.Subscribers({ model: this.model });
    this.versions    = new s.views.Versions({ model: this.model });
    
    // TODO: Instead listen for a document-changed event
    graph.bind('dirty', _.bind(function() {
      this.updatePublishState();
    }, this));

    this.currentView = null;
    
    _.bindAll(this, 'deselect', 'onKeydown');
    $(document.body)
      // .click(this.deselect) // Disabled for now as it breaks interaction with the shelf
      .keydown(this.onKeydown);
  },

  render: function () {
    $(this.el).html(s.util.tpl('document', {
      doc: this.model
    }));
    
    $(this.toc.render().el).hide().appendTo(this.$('#document'));
    $(this.node.render().el).appendTo(this.$('#document'));
    
    if (this.authorized && !this.version) { this.edit(); }
    
    return this;
  },

  remove: function () {
    $(document.body)
      // .unbind('click', this.deselect) // Disabled for now as it breaks interaction with the shelf
      .unbind('keydown', this.onKeydown);
    $(this.el).remove();
    return this;
  },


  // Events
  // ------

  events: {
    'click .toggle-subscription': 'toggleSubscription',
    'click .settings':    'toggleSettings',
    'click .publish':     'togglePublish',
    'click .invite':      'toggleInvite',
    'click .subscribers': 'toggleSubscribers',
    'click .versions':    'toggleVersions',
    'click .export':      'toggleExport',
    'click #toc':         'toggleTOC',
    'click .toggle-toc':  'toggleTOC'
  },

  // Handlers
  // --------

  toggleSubscription: function (e) {
    if (!this.model.get('subscribed')) {
      subscribeDocument(this.model, _.bind(function (err) {
        this.$('.action.toggle-subscription a').html('Unsubscribe');
        this.$('.tab.subscribers').html(this.model.get('subscribers'));
      }, this));
    } else {
      unsubscribeDocument(this.model, _.bind(function (err) {
        this.$('.action.toggle-subscription a').html('Subscribe');
        this.$('.tab.subscribers').html(this.model.get('subscribers'));
      }, this));
    }
    return false;
  },

  toggleSettings:    function (e) { this.toggleView('settings');    return false; },
  togglePublish:     function (e) { this.toggleView('publish');     return false; },
  toggleSubscribers: function (e) { this.toggleView('subscribers'); return false; },
  toggleVersions:    function (e) { this.toggleView('versions');    return false; },
  toggleInvite:      function (e) { this.toggleView('invite');      return false; },
  toggleExport:      function (e) { this.toggleView('export');      return false; },

  toggleTOC: function (e) {
    if ($(this.toc.el).is(":hidden")) {
      $(this.toc.render().el).show();
    } else {
      $(this.toc.el).hide();
    }
    
    return false;
  },

  onKeydown: function (e) {
    if (e.keyCode === 27) {
      // Escape key
      this.deselect();
    }
  },


  // Helpers
  // -------

  updatePublishState: function () {
    $('#document_navigation .publish-state')
       .removeClass()
       .addClass("publish-state "+getPublishState(this.model));
  },

  edit: function () {
    this.node.transitionTo('write');
  },

  deselect: function () {
    if (this.node) {
      this.node.deselectNode();
      window.editor.deactivate();
      this.$(':focus').blur();
    }
  },

  resizeShelf: function () {
    var shelfHeight   = this.currentView ? $(this.currentView.el).outerHeight() : 0
    ,   contentMargin = shelfHeight + 100;
    this.$('#document_shelf').css({ height: shelfHeight + 'px' });
    this.$('#document_content').css({ 'margin-top': contentMargin + 'px' });
  },

  toggleView: function (viewname) {
    var view = this[viewname];
    var shelf   = this.$('#document_shelf')
    ,   content = this.$('#document_content');
    
    if (this.currentView) {
      this.currentView.unbind('resize', this.resizeShelf);
      // It's important to use detach (not remove) to retain the view's event
      // handlers
      $(this.currentView.el).detach();
    }
    
    this.$('.document.tab').removeClass('selected');
    if (view === this.currentView) {
      this.currentView = null;
      this.resizeShelf();
    } else {
      $('.document.tab.'+viewname).addClass('selected');
      view.load(_.bind(function (err) {
        view.bind('resize', this.resizeShelf);
        shelf.append(view.el)
        this.currentView = view;
        view.render();
      }, this));
    }
  }
});
