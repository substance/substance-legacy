// Document
// -------------

s.views.Document = Backbone.View.extend({

  initialize: function () {
    _.bindAll(this);
    
    this.node     = s.views.Node.create({ model: this.model });
    this.toc      = new s.views.TOC({ model: this.model });
    this.settings = new s.views.DocumentSettings({ model: this.model });
    this.publish  = new s.views.Publish({ model: this.model });
    this.invite   = new s.views.Invite({ model: this.model });
    this.export   = new s.views.Export({ model: this.model });
    
    this.currentView = null;
    
    _.bindAll(this, 'deselect', 'onKeydown');
    $(document.body)
      // .click(this.deselect) // Disabled for now as it breaks interaction with the shelf
      .keydown(this.onKeydown);
    
    var render = this.render;
    var called = false;
    this.render = function () {
      if (called) {
        throw new Error("s.views.Document#render should be called only once");
      } else {
        called = true;
        return render.call(this);
      }
    }
  },

  render: function () {
    $(this.el).html(s.util.tpl('document', {
      doc: this.model
    }));
    
    $(this.toc.render().el).hide().appendTo(this.$('#document'));
    $(this.node.render().el).appendTo(this.$('#document'));
    
    if (this.authorized && !this.version) this.toggleEditMode();
    
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
    'click .settings': 'toggleSettings',
    'click .publish':  'togglePublish',
    'click .invite':   'toggleInvite',
    'click .export':   'toggleExport',
    'click #toc': 'toggleTOC',
    'click .toggle-toc': 'toggleTOC'
  },

  // Handlers
  // --------

  toggleSubscription: function (e) {
    if (!this.model.get('subscribed')) {
      subscribeDocument(this.model, _.bind(function (err) {
        this.$('.toggle-subscription').addClass('active')
          .find('.count').text(this.model.get('subscribers'));
      }, this));
    } else {
      unsubscribeDocument(this.model, _.bind(function (err) {
        this.$('.toggle-subscription').removeClass('active')
          .find('.count').text(this.model.get('subscribers'));
      }, this));
    }
    return false;
  },

  toggleSettings: function (e) { this.toggleView(this.settings); return false; },
  togglePublish:  function (e) { this.toggleView(this.publish);  return false; },
  toggleInvite:   function (e) { this.toggleView(this.invite);   return false; },
  toggleExport:   function (e) { this.toggleView(this.export);   return false; },

  toggleTOC: function (e) {
    if ($(this.toc.el).is(":hidden")) {
      $(this.toc.render().el).slideDown();
    } else {
      $(this.toc.el).slideUp();
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

  deselect: function () {
    if (this.node) {
      this.node.deselectNode();
      window.editor.deactivate();
      this.$(':focus').blur();
    }
  },

  resizeShelf: function () {
    var shelfHeight   = this.currentView ? $(this.currentView.el).height() : 0
    ,   contentMargin = shelfHeight + 100;
    this.$('#document_shelf').css({ height: shelfHeight + 'px' });
    this.$('#document_content').css({ 'margin-top': contentMargin + 'px' });
  },

  toggleView: function (view) {
    var shelf   = this.$('#document_shelf')
    ,   content = this.$('#document_content');
    
    if (this.currentView) {
      this.currentView.unbind('resize', this.resizeShelf);
      // It's important to use detach (not remove) to retain the view's event
      // handlers
      $(this.currentView.el).detach();
    }
    
    if (view === this.currentView) {
      this.currentView = null;
      this.resizeShelf();
    } else {
      view.load(_.bind(function (err) {
        view.bind('resize', this.resizeShelf);
        shelf.append(view.el)
        this.currentView = view;
        view.render();
      }, this));
    }
    //this.$('.views .document.view').removeClass('selected');
    //$('.document.view.'+view).addClass('selected');
  }

});
