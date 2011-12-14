// Document Views
// -------------

var DocumentViews = {};

DocumentViews["publish"] = Backbone.View.extend({
  initialize: function(options) {
    this.document = options.document;
  },
  
  render: function() {
    $('#document_shelf').html(_.tpl('document_publish'), {
      
    });
  }
});


DocumentViews["export"] = Backbone.View.extend({
  render: function() {
    $('#document_shelf').html(_.tpl('document_export'));
  }
});


DocumentViews["invite"] = Backbone.View.extend({
  render: function() {
    $('#document_shelf').html(_.tpl('document_invite'));
  }
});








// Document
// -------------

var Document = Backbone.View.extend({
  events: {
    'click a.toggle-edit-mode': 'toggleEditMode',
    'click a.toggle-show-mode': 'toggleShowMode',
    'click a.subscribe-document': 'subscribeDocument',
    'click a.unsubscribe-document': 'unsubscribeDocument',
    'click .views .document.view': 'toggleView'
  },
  
  // Handlers
  // -------------
  
  toggleView: function(e) {
    this.navigate($(e.currentTarget).attr('view'))
  },
  
  // Methods
  // -------------
  
  navigate: function(view) {
    this.$('.views .document.view').removeClass('selected');
    $('.document.view.'+view).addClass('selected');
    this.selectedView = view;
    
    console.log(view);
    this.view = new DocumentViews[this.selectedView]({document: this});
    this.view.render();
    $('#document_shelf').css('height', $('#document_shelf .shelf-content').height());
    $('#document_content').css('margin-top', $('#document_shelf .shelf-content').height()+100);
  },
  
  initialize: function() {
    var that = this;
    
    this.app = this.options.app;
    this.mode = 'show';
    
    this.selectedView = "publish";
    
    this.view = new DocumentViews[this.selectedView]({document: this});
    
    this.bind('changed', function() {
      document.title = that.model.get('title') || 'Untitled';
      // Re-render Document browser
      that.app.browser.render();
    });
    
    _.bindAll(this, 'deselect', 'onKeydown');
    $(document.body)
      .click(this.deselect)
      .keydown(this.onKeydown);
  },

  remove: function () {
    $(document.body)
      .unbind('click', this.deselect)
      .unbind('keydown', this.onKeydown);
  },
  
  render: function() {
    // Render all relevant sub views
    $(this.el).html(_.tpl('document', {
      mode: this.mode,
      doc: this.model,
      selectedView: this.selectedView
    }));
    
    // TODO: 
    // this.renderMenu();

    if (this.model) {
      this.node = Node.create({ model: this.model });
      this.attributes = new Attributes({ model: this.model, el: this.$('#attributes').get(0) }).render();
      this.$('#document').show();
      $('#document_tree').empty();
      this.toc = new TOC({ model: this.model, el: this.$('#toc_wrapper').get(0) }).render();
      $(this.node.render().el).appendTo(this.$('#document_tree'));
      
      if (this.authorized && !this.version) this.toggleEditMode();
    }
  },

  toggleEditMode: function(e) {
    if (e) e.preventDefault();
        
    this.$('.toggle-show-mode').removeClass('active');
    this.$('.toggle-edit-mode').addClass('active');
    
    if (this.node) {
      this.node.transitionTo('write');
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
  
  
  loadedDocuments: {},
  
  togglePublishSettings: function() {
    $('#document_settings').hide();
    $('.view-action-icon.settings').removeClass('active');
    
    $('#document_export').hide();
    $('.view-action-icon.export').removeClass('active');
    
    this.publishSettings.load();
    
    if ($('#publish_settings').is(':visible')) {
      $('.view-action-icon.publish-settings').removeClass('active');
    } else {
      $('.view-action-icon.publish-settings').addClass('active');
    }
    
    $('#publish_settings').slideToggle();

    return false;
  },
  
  toggleExport: function() {
    $('#document_settings').hide();
    $('.view-action-icon.settings').removeClass('active');
    
    $('#publish_settings').hide();
    $('.view-action-icon.publish-settings').removeClass('active');
    
    $('#document_export').slideToggle();
    $('.view-action-icon.export').toggleClass('active');
    return false;
  },
  
  toggleSettings: function() {
    $('#document_export').hide();
    $('.view-action-icon.export').removeClass('active');
    
    $('#publish_settings').hide();
    $('.view-action-icon.publish-settings').removeClass('active');
    
    this.settings.load();
    
    $('#document_settings').slideToggle();
    $('.view-action-icon.settings').toggleClass('active');
    return false;
  },
  
  
  // Extract available documentTypes from config
  documentTypes: function() {
    var result = [];
    graph.get('/config/substance').get('document_types').each(function(type, key) {
      result.push({
        type: key,
        name: graph.get(key).name
      });
    });
    return result;
  },
  
  renderMenu: function() {
    // if (this.model) {
    //   $('#document_tab').show();
    //   $('#document_tab').html(_.tpl('document_tab', {
    //     username: this.model.get('creator')._id.split('/')[2],
    //     document_name: this.model.get('name')
    //   }));
    // }
  },
  
  newDocument: function(type, name, title) {
    this.model = createDoc(type, name, title);
    
    this.status = null;
    this.authorized = true;
    $(this.el).show();
    this.render();
    this.loadedDocuments[app.username+"/"+name] = this.model._id;
    
    // Update browser graph
    if (app.browser && app.browser.query && app.browser.query.type === "user" && app.browser.query.value === app.username) {
      app.browser.graph.set('nodes', this.model._id, this.model);
    }
    
    // Move to the actual document
    app.navigate('document');
    
    router.navigate(this.app.username+'/'+name);
    $('#document_wrapper').attr('url', '#'+this.app.username+'/'+name);
    
    this.trigger('changed');
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },
  
  loadDocument: function(username, docname, version, nodeid, commentid, mode) {
    var that = this;
    
    $('#tabs').show();
    function init(id) {
      that.model = graph.get(id);
      
      if (!(head.browser.webkit || head.browser.mozilla)) {
        // TODO: prevent write mode
        alert("Your browser is not yet supported. We recommend Google Chrome and Safari, but you can also use Firefox.");
      }
      
      if (that.model) {
        that.render();
        
        // window.positionBoard();
        that.trigger('changed');
        that.loadedDocuments[username+"/"+docname] = id;
        
        // Update browser graph reference
        app.browser.graph.set('nodes', id, that.model);
        app.navigate('document');
        
        // TODO: scroll to desired part of the document
      } else {
        $('#document_wrapper').html('Document loading failed');
      }
    }
    
    var id = that.loadedDocuments[username+"/"+docname];
    $('#document_tab').show();
    

    function printError(error) {
      if (error === "not_authorized") {
        $('#document_wrapper').html("<div class=\"notification error\">You are not authorized to access this document.</div>");
      } else {
        $('#document_wrapper').html("<div class=\"notification error\">The requested document couldn't be found.</div>");
      }
      app.navigate('document');
    }

    $.ajax({
      type: "GET",
      url: version ? "/documents/"+username+"/"+docname+"/"+version : "/documents/"+username+"/"+docname,
      dataType: "json",
      success: function(res) {
        that.version = res.version;
        that.authorized = res.authorized;
        that.published = res.published;
        if (res.status === 'error') {
          printError(res.error);
        } else {
          graph.merge(res.graph);
          init(res.id);
        }
      },
      error: function(err) {
        printError(JSON.parse(err.responseText).error);
      }
    });
  },
  
  subscribeDocument: function() {
    if (!app.username) {
      alert('Please log in to make a subscription.');
      return false;
    }
    
    graph.set(null, {
      type: "/type/subscription",
      user: "/user/"+app.username,
      document: this.model._id
    });
    
    this.model.set({
      subscribed: true,
      subscribers: this.model.get('subscribers') + 1
    });
    
    this.model._dirty = false; // Don't make dirty
    this.render();
    return false;
  },
  
  unsubscribeDocument: function() {
    var that = this;
    
    // Fetch the subscription object
    graph.fetch({type: "/type/subscription", "user": "/user/"+app.username, "document": this.model._id}, function(err, nodes) {
      if (nodes.length === 0) return;
      
      // Unsubscribe
      graph.del(nodes.first()._id);
      that.model.set({
        subscribed: false,
        subscribers: that.model.get('subscribers') - 1
      });
      that.model._dirty = false; // Don't make dirty
      that.render();
    });
    
    return false;
  },
  
  closeDocument: function() {
    this.model = null;
    router.navigate(this.app.username);
    $('#document_wrapper').attr('url', '#'+this.app.username);
    app.navigate('content');
    this.render();
  },
  
  deleteDocument: function(id) {
    var that = this;
    graph.del(id);
    app.browser.graph.del(id);
    app.browser.render();
    setTimeout(function() {
      app.navigate('browser');
    }, 300);
    notifier.notify(Notifications.DOCUMENT_DELETED);
  },

  // Update the document's name
  updateName: function(name) {
    this.model.set({
      name: name
    });
  }
});
