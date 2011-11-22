// TODO: move to model
function addEmptyDoc(type, name, title) {
  var docType = graph.get(type);
  var doc = graph.set(Data.uuid('/document/'+ app.username +'/'), docType.meta.template);
  doc.set({
    creator: "/user/"+app.username,
    created_at: new Date(),
    updated_at: new Date(),
    name: name,
    title: title
  });
  return doc;
};

// The Document Editor View

var Document = Backbone.View.extend({
  events: {
    'click a.toggle-edit-mode': 'toggleEditMode',
    'click a.toggle-show-mode': 'toggleShowMode',
    'click a.subscribe-document': 'subscribeDocument',
    'click a.unsubscribe-document': 'unsubscribeDocument',
    'click a.export-document': 'toggleExport',
    'click a.toggle-settings': 'toggleSettings',
    'click a.toggle-publish-settings': 'togglePublishSettings'
  },
  
  initialize: function() {
    var that = this;
    this.attributes = new Attributes({model: this.model});
    this.settings = new DocumentSettings();
    
    this.publishSettings = new PublishSettings();
    
    this.app = this.options.app;
    this.mode = 'show';
    
    this.bind('changed', function() {
      document.title = that.model.get('title') || 'Untitled';
      // Re-render Document browser
      that.app.browser.render();
    });
  },
  
  render: function() {
    // Render all relevant sub views
    $(this.el).html(_.tpl('document_wrapper', {
      mode: this.mode,
      doc: this.model
    }));
    this.renderMenu();

    if (this.model) {
      // Render Attributes
      this.node = Node.create({ model: this.model });
      this.attributes.render();
      this.$('#attributes').show();
      this.$('#document').show();
      $('#document_tree').html('');
      this.toc = new TOC({ model: this.model, el: this.$('#toc_wrapper').get(0) });
      this.toc.render();
      $(this.node.render().el).appendTo(this.$('#document_tree'));
      
      if (this.authorized && !this.version) this.toggleEditMode();
    }
  },

  toggleEditMode: function(e) {
    if (e) e.preventDefault();
    
    //var user = app.document.model.get('creator')._id.split('/')[2];
    //var name = app.document.model.get('name');
    //$('#document_wrapper').attr('url', user+"/"+name);
    
    $('#document').addClass('edit-mode');
    this.$('.toggle-show-mode').removeClass('active');
    this.$('.toggle-edit-mode').addClass('active');
    
    if (this.node) {
      this.node.transitionTo('write');
      this.node.select(); // select root node
    }
  },
  
  toggleShowMode: function(e) {
    if (e) e.preventDefault();
    
    //var user = app.document.model.get('creator')._id.split('/')[2];
    //var name = app.document.model.get('name');
    //$('#document_wrapper').attr('url', user+"/"+name);
    
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
    if (this.model) {
      $('#document_tab').show();
      $('#document_tab').html(_.tpl('document_tab', {
        username: this.model.get('creator')._id.split('/')[2],
        document_name: this.model.get('name')
      }));
    }
  },
  
  newDocument: function(type, name, title) {
    this.model = addEmptyDoc(type, name, title);
    
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
    app.toggleView('document');
    
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
        app.toggleView('document');
        
        // TODO: scroll to desired part of the document
        /*
        // Scroll to target node
        if (nodeid && !commentid) app.scrollTo(nodeid);
        
        // Scroll to comment
        if (nodeid && commentid) {
          var targetNode = graph.get(nodeid.replace(/_/g, '/'));
          
          that.selectedNode = targetNode;
          
          that.enableCommentEditor(targetNode, function() {
            $('#'+nodeid+' > .comments-wrapper').show();
            graph.get(commentid.replace(/_/g, '/')) ? app.scrollTo(commentid) : app.scrollTo('comments'+nodeid);
          });
        }
        */
      } else {
        $('#document_wrapper').html('Document loading failed');
      }
    }
    
    var id = that.loadedDocuments[username+"/"+docname];
    $('#document_tab').show();
    
    // Already loaded - no need to fetch it
    // if (id) {
    //   // TODO: check if there are changes from a realtime session
    //   init(id);
    // } else {
      
    function printError(error) {
      if (error === "not_authorized") {
        $('#document_tab').html('&nbsp;&nbsp;&nbsp; Not Authorized');
        $('#document_wrapper').html("<div class=\"notification error\">You are not authorized to access this document.</div>");
      } else {
        $('#document_tab').html('&nbsp;&nbsp;&nbsp; Document not found');
        $('#document_wrapper').html("<div class=\"notification error\">The requested document couldn't be found.</div>");
      }
      app.toggleView('document');
    }

    $('#document_tab').html('&nbsp;&nbsp;&nbsp;Loading...');
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
    // }
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
    $('#document_tab').hide();
    app.toggleView('content');
    this.render();
  },
  
  // Delete an existing document, given that the user is authorized
  // -------------
  
  deleteDocument: function(id) {
    var that = this;
    graph.del(id);
    app.browser.graph.del(id);
    app.browser.render();
    $('#document_tab').hide();
    setTimeout(function() {
      app.toggleView('browser');
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
