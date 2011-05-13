// The Application
// ---------------

// This is the top-level piece of UI.
var Application = Backbone.View.extend({
  events: {
    'click .toggle-new-document': 'toggleNewDocument',
    'click .new-document': 'newDocument',
    'click #dashboard_toggle': 'showDashboard',
    'click #document_toggle': 'showDocument',
    'click a.load-document': 'loadDocument',
    'click a.save-document': 'saveDocument',
    'click a.logout': 'logout',
    'click a.signup': 'toggleSignup',
    'click .tab': 'switchTab',
    'click a.show-attributes': 'showAttributes',
    'click a.publish-document': 'publishDocument',
    'click a.unpublish-document': 'unpublishDocument',
    'submit #create_document': 'createDocument',
    'submit #login-form': 'login',
    'click a.delete-document': 'deleteDocument',
    'click a.view-collaborators': 'viewCollaborators',
    'click a.toggle-document-views': 'toggleDocumentViews',
    'click a.toggle-signup': 'toggleSignup',
    'click a.toggle-startpage': 'toggleStartpage',
    'click a.toggle-edit-mode': 'toggleEditMode',
    'click a.toggle-show-mode': 'toggleShowMode',
    'click a.toggle-user-settings': 'toggleUserSettings',
    'submit #signup-form': 'registerUser'
  },

  login: function(e) {
    this.authenticate();
    return false;
  },
  
  newDocument: function() {
    if (!head.browser.webkit) {
      alert("You need to use a Webkit based browser (Google Chrome, Safari) in order to write documents. In future, other browers will be supported too.");
      return false;
    }
    this.content = new NewDocument({el: '#content_wrapper'});
    this.content.render();
    
    this.toggleView('content');
    return false;
  },
  
  scrollTo: function(id) {
    var offset = $('#'+id).offset();                             
    offset ? $('html, body').animate({scrollTop: offset.top}, 'slow') : null;
    return false;
  },
  
  toggleUserSettings: function() {
    this.content = new UserSettings({el: '#content_wrapper'});
    this.content.render();
    this.toggleView('content');    
    return false;
  },
  
  toggleSignup: function() {
    app.browser.browserTab.render();
    $('#content_wrapper').html(_.tpl('signup'));
    app.toggleView('content');
    return false;
  },
  
  toggleStartpage: function() {
    app.browser.browserTab.render();
    $('#content_wrapper').html(_.tpl('startpage'));
    app.toggleView('content');
    return false;
  },
  
  searchDocs: function(searchstr) {
    app.browser.load({"type": "keyword", "value": encodeURI(searchstr)});
    $('#browser_wrapper').attr('url', '#search/'+encodeURI(searchstr));
    
    app.browser.bind('loaded', function() {
      app.toggleView('browser');
    });
  },
  
  switchTab: function(e) {
    this.toggleView($(e.currentTarget).attr('view'));
  },
  
  toggleView: function(view) {
    $('.tab').removeClass('active');
    $('#'+view+'_tab').addClass('active');
    if (view === 'browser' && !this.browser.loaded) return;
    $('.view').hide();
    $('#'+view+'_wrapper').show();

    // Wait until url update got injected
    setTimeout(function() {
      controller.saveLocation($('#'+view+'_wrapper').attr('url'));
    }, 200);
    return false;
  },
  
  createDocument: function(e) {
    var that = this;
    var name = $('#create_document input[name=new_document_name]').val();
    var type = "/type/article"; // $('#create_document select[name=document_type]').val();
    
    if (new RegExp(graph.get('/type/document').get('properties', 'name').validator).test(name)) {
      
      // TODO: find a more efficient way to check for existing docs.
      $.ajax({
        type: "GET",
        url: "/documents/"+app.username+"/"+name,
        dataType: "json",
        success: function(res) {
          if (res.status === 'error') {
            that.document.newDocument(type, name);
          } else {
            $('#create_document input[name=new_document_name]').addClass('error');
            $('#new_document_name_message').html('This document name is already taken.');            
          }
        },
        error: function(err) {
          $('#document_wrapper').html('Document loading failed');
        }
      });
      
      return false;
    } else {
      $('#create_document input[name=new_document_name]').addClass('error');
      $('#new_document_name_message').html('Invalid document name. No spaces or special characters allowed.');
    }
    return false;
  },
  
  toggleEditMode: function(e) {
    var user = app.document.model.get('creator').get('username');
    var name = app.document.model.get('name');
    
    app.document.loadDocument(user, name, null, 'edit');
    return false;
  },
  
  toggleShowMode: function(e) {
    var user = app.document.model.get('creator').get('username');
    var name = app.document.model.get('name');
    
    app.document.loadDocument(user, name, null, 'show');
    return false;
  },
  
  loadDocument: function(e) {
      var user = $(e.currentTarget).attr('user');
          name = $(e.currentTarget).attr('name');

      app.document.loadDocument(user, name);
      if (controller) {
        controller.saveLocation($(e.currentTarget).attr('href'));
        $('#document_wrapper').attr('url', $(e.currentTarget).attr('href'));
      }
    return false;
  },
  
  // Handle top level events
  // -------------
  
  showAttributes: function() {
    app.document.drawer.toggle('Attributes');
    $('.show-attributes').toggleClass('selected');
    return false;
  },
  
  logout: function() {
    var that = this;
    
    $.ajax({
      type: "POST",
      url: "/logout",
      dataType: "json",
      success: function(res) {
        that.username = null;
        that.authenticated = false;
        that.document.closeDocument();
        that.browser.loaded = false;
        that.browser.render();
        that.render();
        $('#document_tab').hide();
        
        app.toggleStartpage();
        
        controller.saveLocation('');
        $('.new-document').hide();
      }
    });
    return false;
  },
  
  deleteDocument: function(e) {
    if (confirm('Are you sure to delete this document?')) {
      this.document.deleteDocument(app.document.model._id);
      this.document.closeDocument();
    }
    return false;
  },
  
  // Application Setup
  // -------------
  
  updateSystemStatus: function(status) {
    this.activeUsers = status.active_users;
  },
  
  query: function() {
    return this.authenticated ? { "type": "user", "value": this.username }
                              : { "type": "user", "value": "demo" }
  },
  
  initialize: function() {
    var that = this;
    
    // Initialize browser
    this.browser = new DocumentBrowser({
      el: this.$('#browser_wrapper'),
      app: this
    });
    
    // Initialize document
    this.document = new Document({el: '#document_wrapper', app: this});
    this.header = new Header({el: '#header', app: this});
    this.activeUsers = [];
    
    // Try to establish a server connection
    // this.connect();
    // this.bind('connected', function() {
    //   notifier.notify(Notifications.CONNECTED);
    // });
    
    // Cookie-based auto-authentication
    if (session.username) {
      graph.merge(session.seed);
      this.authenticated = true;
      this.username = session.username;
      this.trigger('authenticated');
      $('#tabs').show();
      $('.new-document').show();
    } else {
      this.authenticated = false;
    }
    
    this.bind('authenticated', function() {
      that.authenticated = true;
      // Re-render browser
      $('#tabs').show();
      $('.new-document').show();
      that.render();
      that.document.closeDocument();
      that.browser.load(that.query());
      
      that.browser.bind('loaded', function() {
        that.toggleView('browser');
      });
      
      controller.saveLocation('#'+that.username);
    });
    
    that.render();
  },
  
  connect: function() {
    var that = this;
    
    DNode({
      Session: {
        updateStatus: function(status) {
          that.document.status = status;
          that.document.trigger('status:changed');
        },
        
        updateSystemStatus: function(status) {
          that.updateSystemStatus(status);
        },
        
        updateNode: function(key, node) {
          app.document.updateNode(key, node);
        },
        
        moveNode: function(sourceKey, targetKey, parentKey, destination) {
          throw 'Not implemented';
        },
        
        insertNode: function(insertionType, node, targetKey, parentKey, destination) {
          if (insertionType === 'sibling') {
            app.document.addSibling(node, targetKey, parentKey, destination);
          } else { // inserionType === 'child'
            app.document.addChild(node, targetKey, parentKey, destination);
          }
        },
        
        removeNode: function(key, parentKey) {
          app.document.removeNode(key, parentKey);
        },
        
        // The server asks for the current (real-time) version of the document
        getDocument: function(callback) {
          var result = that.getFullDocument(app.document.model._id);
          callback(result);
        }
      }
    }).connect(function (remoteHandle) {
      // For later use store a reference to the remote object
      remote = remoteHandle;      
      that.trigger('connected');
    });
  },
  
  getFullDocument: function(id) {    
    var result = {};
    function addNode(id) {
      if (!result[id]) {
        var n = graph.get(id);
        result[id] = n.toJSON();

        // Resolve associated Nodes
        n.type.all('properties').each(function(p) {
          if (p.isObjectType()) {
            n.all(p.key).each(function(obj) {
              if (obj.type) addNode(obj._id);
            });
          }
        });
      }
    }
    addNode(id);
    return result;
  },
  
  authenticate: function() {
    var that = this;
    
    $.ajax({
      type: "POST",
      url: "/login",
      data: {
        username: $('#login-user').val(),
        password: $('#login-password').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.status === 'error') {
          return notifier.notify(Notifications.AUTHENTICATION_FAILED);
        } else {
          graph.merge(res.seed);
          that.username = res.username;
          that.trigger('authenticated');
        }
      },
      error: function(err) {
        notifier.notify(Notifications.AUTHENTICATION_FAILED);
      }
    });
    return false;
  },
  
  registerUser: function() {
    var that = this;
    
    $('.page-content .input-message').empty();
    $('#registration_error_message').empty();
    $('.page-content input').removeClass('error');
    
    $.ajax({
      type: "POST",
      url: "/register",
      data: {
        username: $('#signup_user').val(),
        name: $('#signup_name').val(),
        email: $('#signup_email').val(),
        password: $('#signup_password').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.status === 'error') {
          if (res.field === "username") {
            $('#signup_user').addClass('error');
            $('#signup_user_message').html(res.message);
          } else {
            $('#registration_error_message').html(res.message);
          }
        } else {
          graph.merge(res.seed);
          notifier.notify(Notifications.AUTHENTICATED);
          that.username = res.username;          
          that.trigger('authenticated');
        }
      },
      error: function(err) {
        $('#registration_error_message').html('Unknown error.');
      }
    });
    
    return false;
  },
  
  // Should be rendered just once
  render: function() {
    var that = this;
    this.document.render();
    this.browser.render();
    this.header.render();
    return this;
  }
});

var remote,                              // Remote handle for server-side methods
    app,                                 // The Application
    controller,                          // Controller responding to routes
    editor,                              // A global instance of the Proper Richtext editor
    graph = new Data.Graph(seed, false).connect('ajax'); // The database

(function() {
  $(function() {    
    function browserSupported() {
      if (head.browser.mozilla && head.browser.version > "1.9.2") {
        return true;
      }
      if (head.browser.webkit && head.browser.version > "533.0") {
        return true;
      }
      return false;
    }
    
    if (!browserSupported()) {
      $('#container').html(_.tpl('browser_not_supported'));
      $('#container').show();
      return;
    }
    
    $('#container').show();
    
    function scrollTop() {
      return document.body.scrollTop || document.documentElement.scrollTop;
    }

    window.positionViewActions = function() {
      var main = document.getElementById('main');

      if (main.offsetTop - scrollTop() < 0) {
        $('.view-actions').addClass('docked');
        $('.view-actions').css('left', ($('#document_wrapper').offset().left-60)+'px')
      } else {
        $('.view-actions').css('left', '');
        $('.view-actions').removeClass('docked');
      }
    }
    
    positionViewActions();
    $(window).bind('scroll', positionViewActions);
    $(window).bind('resize', positionViewActions);

    // Start the engines
    app = new Application({el: $('#container'), session: session});
    
    // Set up a global instance of the Proper Richtext Editor
    editor = new Proper();
    
    // Initialize controller
    controller = new ApplicationController({app: this});
    
    // Start responding to routes
    Backbone.history.start();
    
    // Reset document when window gets out of focus
    // document.body.onblur = function() {  if (app.document) app.document.reset(); }
    
    // TODO: Prevent leaving page by pressing backspace
    // $('body').bind('keydown', function(e) {
    //   if (!currently_editing && e.keyCode === 8 ) e.preventDefault();
    // });
    
    // Prevent exit when there are unsaved changes
    window.onbeforeunload = confirmExit;
    function confirmExit()
    {
      if (graph.dirtyNodes().length>0) return "You have unsynced changes, which will be lost. Are you sure you want to leave this page?";
    }
    
    function resetWorkspace() {
      confirm('There are conflicted or rejected nodes since the last sync. The workspace will be reset for your own safety');
      window.location.reload(true);
    }
    
    var pendingSync = false;
    graph.bind('dirty', function() {
      // Reload document browser      
      if (!pendingSync) {
        pendingSync = true;
        setTimeout(function() {
          $('#sync_state').html('Synchronizing...');
          graph.sync(function(err, invalidNodes) {
            pendingSync = false;
            if (!err && invalidNodes.length === 0) {
              $('#sync_state').html('Successfully synced.');
              setTimeout(function() {
                $('#sync_state').html('');
              }, 3000);
            } else {
              resetWorkspace();
            }
          });
        }, 3000);
      }
    });
    
    graph.bind('conflicted', resetWorkspace);
    graph.bind('rejected', resetWorkspace);
  });
})();