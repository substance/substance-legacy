// Document
// -------------

s.views.Document = Backbone.View.extend({
  events: {
    'click a.toggle-edit-mode': 'toggleEditMode',
    'click a.toggle-show-mode': 'toggleShowMode',
    'click a.subscribe-document': 'subscribe',
    'click a.unsubscribe-document': 'unsubscribe',
    'click .views .document.view': 'toggleView',
    'click #toc_wrapper': 'toggleTOC',
    'click .toggle-toc': 'toggleTOC',
    'click a.delete-document': 'deleteDocument'
  },
  
  // Handlers
  // -------------
  
  toggleView: function(e) {
    var view = $(e.currentTarget).attr('view');

    this.$('.views .document.view').removeClass('selected');
    $('.document.view.'+view).addClass('selected');
    this.selectedView = s.util.classify(view);

    this[view]();
    return false;
  },
  
  toggleTOC: function() {
    if ($('#toc_wrapper').is(":hidden")) {
      app.document.toc.render();
      $('#document .board').addClass('active');
      $('#toc_wrapper').slideDown();
      $('#toc_wrapper').css('top', Math.max(_.scrollTop()-$('#document').offset().top, 0));
    } else {
      $('#document .board').removeClass('active');
      $('#toc_wrapper').slideUp();
    }

    return false;
  },

  // Methods
  // -------------

  adjustShelf: function() {
    $('#document_shelf').css('height', $('#document_shelf .shelf-content').height());
    $('#document_content').css('margin-top', $('#document_shelf .shelf-content').height()+100);
  },

  publish: function() {
    loadPublish(this.model.doc, _.bind(function (err, data) {
      this.view = new s.views[this.selectedView]({model: data, el: "#document_shelf"}).render();
      this.adjustShelf();
    }, this));
  },

  export: function() {
    this.view = new s.views[this.selectedView]({el: "#document_shelf"}).render();
    this.adjustShelf();
  },

  invite: function() {
    
  },

  // navigate: function(view) {
  //   this.$('.views .document.view').removeClass('selected');
  //   $('.document.view.'+view).addClass('selected');
  //   this.selectedView = s.util.classify(view);
    
  //   console.log(view);
  //   this.view = new s.views[this.selectedView]({document: this});
  //   this.view.render(function() {
  //     $('#document_shelf').css('height', $('#document_shelf .shelf-content').height());
  //     $('#document_content').css('margin-top', $('#document_shelf .shelf-content').height()+100);
  //   });
    
  // },

  initialize: function() {
    var that = this;
    
    this.app = this.options.app;
    
    this.selectedView = 'Publish';
    this.view = new s.views[this.selectedView]({document: this});
    
    _.bindAll(this, 'deselect', 'onKeydown');
    $(document.body)
      // .click(this.deselect) // Disabled for now as it breaks interaction with the shelf
      .keydown(this.onKeydown);
  },

  remove: function () {
    $(document.body)
      // .unbind('click', this.deselect) // Disabled for now as it breaks interaction with the shelf
      .unbind('keydown', this.onKeydown);
    $(this.el).remove();
    return this;
  },

  render: function() {

    $(this.el).html(s.util.tpl('document', {
      doc: this.model.doc,
      selectedView: this.selectedView
    }));
  
    this.node = s.views.Node.create({ model: this.model.doc });

    this.$('#document').show();
    $('#document_tree').empty();
    this.toc = new s.views.TOC({ model: this.model.doc, el: this.$('#toc_wrapper').get(0) }).render();
    $(this.node.render().el).appendTo(this.$('#document_tree'));
    
    if (this.authorized && !this.version) this.toggleEditMode();
    
    return this;
  },

  toggleEditMode: function(e) {
    if (e) e.preventDefault();
        
    this.$('.toggle-show-mode').removeClass('active');
    this.$('.toggle-edit-mode').addClass('active');
    
    if (this.node) {
      this.node.transitionTo('write');
    }
  },

  toggleShowMode: function(e) {
    if (e) e.preventDefault();
        
    $('#document').removeClass('edit-mode');
    this.$('.toggle-edit-mode').removeClass('active');
    this.$('.toggle-show-mode').addClass('active');
    
    if (this.node) {
      this.node.transitionTo('read');
      this.node.deselect();
    }
  },

  onKeydown: function (e) {
    if (e.keyCode === 27) {
      // Escape key
      this.deselect();
    }
  },

  deselect: function () {
    if (this.node) {
      this.node.deselectNode();
      window.editor.deactivate();
      this.$(':focus').blur();
    }
  },

  newDocument: function(type, name, title) {
    this.model = createDoc(type, name, title);
    
    this.status = null;
    this.authorized = true;
    $(this.el).show();
    this.render();
    
    router.navigate(this.app.username+'/'+name);
    
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },

  subscribe: function (e) {
    if (!app.username) {
      alert('Please log in to make a subscription.');
      return false;
    }
    
    var that = this;
    subscribeDocument(this.model, function (err) {
      //that.render();
    });
    return false;
  },

  unsubscribe: function (e) {
    var that = this;
    unsubscribeDocument(this.model, function (err) {
      //that.render();
    });
    return false;
  },

  deleteDocument: function () {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocument(this.model, function (err) {
        router.navigate('', true); // TODO
      });
    }
    return false;
  }

});
