// Document
// -------------

s.views.Document = Backbone.View.extend({
  events: {
    'click .toggle-subscription': 'toggleSubscription',
    'click .views .document.view': 'toggleView',
    'click #toc': 'toggleTOC',
    'click .toggle-toc': 'toggleTOC'
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

  toggleTOC: function (e) {
    if ($(this.toc.el).is(":hidden")) {
      $(this.toc.render().el).slideDown();
    } else {
      $(this.toc.el).slideUp();
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
    this.selectedView = 'Publish';
    this.view = new s.views[this.selectedView]({document: this});
    
    this.node = s.views.Node.create({ model: this.model });
    this.toc = new s.views.TOC({ model: this.model });
    
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

  remove: function () {
    $(document.body)
      // .unbind('click', this.deselect) // Disabled for now as it breaks interaction with the shelf
      .unbind('keydown', this.onKeydown);
    $(this.el).remove();
    return this;
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

  subscribe: function (e) {
    if (!app.username) {
      alert('Please log in to make a subscription.');
      return false;
    }
    
    subscribeDocument(this.model, function (err) {
      // render
    });
    return false;
  },

  unsubscribe: function (e) {
    unsubscribeDocument(this.model, function (err) {
      // render
    });
    return false;
  },

  deleteDocument: function (e) {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocument(this.model, function (err) {
        router.navigate('', true); // TODO
      });
    }
    return false;
  }

});
