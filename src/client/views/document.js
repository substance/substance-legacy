var DocumentViews = {};

// Publish
// -------------

DocumentViews["publish"] = Backbone.View.extend({
  events: {
    'click a.publish-document': 'publishDocument',
    'click .remove-version': 'removeVersion',
    'focus #version_remark': 'focusRemark',
    'blur #version_remark': 'blurRemark'
  },
  
  focusRemark: function(e) {
    var input = $('#version_remark');
    if (input.val() === 'Enter optional remark.') input.val('');
  },
  
  blurRemark: function(e) {
    var input = $('#version_remark');
    if (input.val() === '') input.val('Enter optional remark.');
  },
  
  publishDocument: function(e) {
    var that = this;
    var remark = $('#version_remark').val();
    
    $.ajax({
      type: "POST",
      url: "/publish",
      data: {
        document: app.document.model._id,
        remark: remark === 'Enter optional remark.' ? '' : remark
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return alert(res.error);
        that.load();
        app.document.published = true;
        app.document.render();
        $('#publish_settings').show();
      },
      error: function(err) {
        console.log(err);
        alert("Unknown error occurred");
      }
    });
    
    return false;
  },
  
  removeVersion: function(e) {
    var version = $(e.currentTarget).attr('version');
    var that = this;
    
    window.pendingSync = true;
    graph.del(version);
    
    // Trigger immediate sync
    graph.sync(function (err) {
      window.pendingSync = false;
      that.load();
      
      if (that.versions.length === 1) {
        app.document.published = false;
        app.document.render();
        $('#publish_settings').show();
      }
    });
    
    return false;
  },
  
  load: function(callback) {
    var that = this;
    // Load versions
    graph.fetch({"type": "/type/version", "document": app.document.model._id}, function(err, versions) {
      var ASC_BY_CREATED_AT = function(item1, item2) {
        var v1 = item1.value.get('created_at'),
            v2 = item2.value.get('created_at');
        return v1 === v2 ? 0 : (v1 < v2 ? -1 : 1);
      };
      
      that.versions = versions.sort(ASC_BY_CREATED_AT);
      that.loaded = true;
      that.render(callback);
    });
  },
  
  
  initialize: function(options) {
    this.document = options.document;
    this.el = '#document_shelf';
  },
  
  render: function(callback) {
    if (!this.loaded) return this.load(callback);
    $(this.el).html(_.tpl('document_publish', {
      versions: this.versions,
      document: app.document.model
    }));
    this.delegateEvents();
    callback();
  }
});




// Export
// -------------

DocumentViews["export"] = Backbone.View.extend({
  render: function(callback) {
    $('#document_shelf').html(_.tpl('document_export'));
    callback();
  }
});


// Invite
// -------------

DocumentViews["invite"] = Backbone.View.extend({
  events: {
    'submit form': 'invite',
    'change select.change-mode': 'changeMode',
    'click a.remove-collaborator': 'removeCollaborator'
  },
  
  changeMode: function(e) {
    var collaboratorId = $(e.currentTarget).attr('collaborator');
    var mode = $(e.currentTarget).val();
    var that = this;
    
    window.pendingSync = true;
    
    graph.get(collaboratorId).set({
      mode: mode
    });
    
    // trigger immediate sync
    graph.sync(function(err) {
      window.pendingSync = false;
      that.render();
    });
    
    return false;
  },
  
  removeCollaborator: function(e) {
    var collaboratorId = $(e.currentTarget).attr('collaborator');
    var that = this;
    
    window.pendingSync = true;
    graph.del(collaboratorId);
    
    // trigger immediate sync
    graph.sync(function(err) {
      window.pendingSync = false;
      that.collaborators.del(collaboratorId);
      that.render();
    });

    return false;
  },
  
  invite: function() {
    var that = this;
    $.ajax({
      type: "POST",
      url: "/invite",
      data: {
        email: $('#collaborator_email').val(),
        document: app.document.model._id,
        mode: $('#collaborator_mode').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return alert(res.error);
        that.load();
      },
      error: function(err) {
        alert("Unknown error occurred");
      }
    });
    return false;
  },
  
  load: function(callback) {
    var that = this;
    graph.fetch({"type": "/type/collaborator", "document": app.document.model._id}, function(err, nodes) {
      that.collaborators = nodes;
      that.loaded = true;
      that.render(callback);
    });
  },
  
  initialize: function(options) {
    this.document = options.document;
    this.el = '#document_shelf';
  },
  
  render: function(callback) {
    if (!this.loaded) return this.load(callback);
    $(this.el).html(_.tpl('document_invite', {
      collaborators: this.collaborators,
      document: this.document.model
    }));
    this.delegateEvents();
    callback();
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
    this.navigate($(e.currentTarget).attr('view'));
  },
  
  // Methods
  // -------------
  
  navigate: function(view) {
    this.$('.views .document.view').removeClass('selected');
    $('.document.view.'+view).addClass('selected');
    this.selectedView = view;
    
    console.log(view);
    this.view = new DocumentViews[this.selectedView]({document: this});
    this.view.render(function() {
      $('#document_shelf').css('height', $('#document_shelf .shelf-content').height());
      $('#document_content').css('margin-top', $('#document_shelf .shelf-content').height()+100);
    });
    
  },
  
  initialize: function() {
    var that = this;
    
    this.app = this.options.app;
    this.mode = 'show';
    
    this.selectedView = "publish";
    
    this.view = new DocumentViews[this.selectedView]({document: this});
    
    this.bind('changed', function() {
      document.title = that.model.get('title') || 'Untitled';
      that.app.browser.render();
    });
    
    _.bindAll(this, 'deselect', 'onKeydown');
    $(document.body)
      // .click(this.deselect) // Disabled for now as it breaks interaction with the shelf
      .keydown(this.onKeydown);
  },

  remove: function () {
    $(document.body)
      // .unbind('click', this.deselect) // Disabled for now as it breaks interaction with the shelf
      .unbind('keydown', this.onKeydown);
  },
  
  render: function() {
    if (!this.model) return;
    
    // Render all relevant sub views
    $(this.el).html(_.tpl('document', {
      mode: this.mode,
      doc: this.model,
      selectedView: this.selectedView
    }));
    
    if (this.model) {
      this.node = Node.create({ model: this.model });
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
  
  newDocument: function(type, name, title) {
    this.model = createDoc(type, name, title);
    
    this.status = null;
    this.authorized = true;
    $(this.el).show();
    this.render();
    
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
      
      if (!(head.browser.webkit || head.browser.mozilla)) {
        // TODO: prevent write mode
        alert("Your browser is not yet supported. We recommend Google Chrome and Safari, but you can also use Firefox.");
      }
      
      if (that.model) {
        that.render();
        that.trigger('changed');
        
        // Update browser graph reference
        app.browser.graph.set('nodes', id, that.model);
        app.navigate('document');
        
        // TODO: scroll to desired part of the document
      } else {
        $('#document_wrapper').html('Document loading failed');
      }
    }
    
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
    
    this.model._dirty = false;
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
      that.model._dirty = false;
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
