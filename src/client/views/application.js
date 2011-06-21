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
    'click .toggle.logout': 'logout',
    'click .toggle.user-settings': 'toggleUserSettings',
    'click .toggle.user-profile': 'toggleUserProfile',
    'submit #signup-form': 'registerUser',
    'click .toggle.notifications': 'toggleNotifications',
    'click .toggle-toc': 'toggleTOC',
    'click #event_notifications a .notification': 'hideNotifications',
    'click #toc_wrapper': 'toggleTOC',
    'click a.open-notification': 'openNotification',
    'change #document_name': 'updateDocumentName'
  },
  
  updateDocumentName: function(e) {
    var name = $(e.currentTarget).val();
    this.checkDocumentName(name, function(valid) {
      if (valid) {
        app.document.updateName(name);
        controller.saveLocation('#'+app.username+'/'+name);
      } else {
        $('#document_name').val(app.document.model.get('name'));
        alert('Sorry, this name is already taken.');
      }
    });
    return false;
  },

  login: function(e) {
    this.authenticate();
    return false;
  },
  
  openNotification: function(e) {
    var url = $(e.currentTarget).attr('href');
    var urlParts = url.replace('#', '').split('/');
    app.document.loadDocument(urlParts[0], urlParts[1], urlParts[2], urlParts[3]);
    $('#document_wrapper').attr('url', url);
    return false;
  },
    
  // Triggered by toggleNotifications
  // Triggers markAllRead
  showNotifications: function() {
    this.header.notificationsActive = true;
    this.header.render();
  },
  
  toggleTOC: function() {
    if ($('#toc_wrapper').is(":hidden")) {
      $('#document .board').addClass('active');
      $('#toc_wrapper').slideDown();
      $('#toc_wrapper').css('top', Math.max(_.scrollTop()-$('#document').offset().top, 0));
    } else {
      $('#document .board').removeClass('active');
      $('#toc_wrapper').slideUp();
    }

    return false;
  },
  
  // Triggered by toggleNotifications and when clicking a notification
  // Triggers count reset (to zero)
  hideNotifications: function() {
    // Mark all notifications as read
    var notifications = graph.find({"type|=": "/type/notification", "recipient": "/user/"+app.username});
    var unread = notifications.select(function(n) { return !n.get('read')});
    unread.each(function(n) {
      n.set({read: true});
    });
    this.header.notificationsActive = false;
    this.header.render();
  },
  
  toggleNotifications: function() {
    $('#event_notifications').hasClass('active') ? this.hideNotifications() : this.showNotifications();
    return false;
  },
  
  loadNotifications: function() {
    var that = this;
    $.ajax({
      type: "GET",
      url: "/notifications",
      dataType: "json",
      success: function(notifications) {
        var newNodes = {};
        _.each(notifications, function(n, key) {
          // Only merge in if not already there
          if (!graph.get(key)) {
            newNodes[key] = n;
          }
        });
        graph.merge(newNodes);
        that.header.render();
      }
    });
  },
  
  toggleUserProfile: function() {
    app.browser.load({"type": "user", "value": this.username});
    app.toggleView('browser');
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
    
    // Initialize Slider
    $('#slider').nivoSlider({
      manualAdvance: true
    });
    // Initialize flattr
    var s = document.createElement('script'), t = document.getElementsByTagName('script')[0];
    s.type = 'text/javascript';
    s.async = true;
    s.src = 'http://api.flattr.com/js/0.6/load.js?mode=auto';
    t.parentNode.insertBefore(s, t);

    app.toggleView('content');
    return false;
  },
  
  searchDocs: function(searchstr) {
    app.browser.load({"type": "search", "value": encodeURI(searchstr)});
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
  
  checkDocumentName: function(name, callback) {
    if (new RegExp(graph.get('/type/document').get('properties', 'name').validator).test(name)) {
      // TODO: find a more efficient way to check for existing docs.
      $.ajax({
        type: "GET",
        url: "/documents/"+app.username+"/"+name,
        dataType: "json",
        success: function(res) {
          res.status === 'error' ? callback(true) : callback(false);
        },
        error: function(err) {
          callback(false);
        }
      });
      return false;
    } else {
      callback(false);
    }
  },
  
  createDocument: function(e) {
    var that = this;
    var title = $('#create_document input[name=new_document_name]').val();
    var name = _.slug(title);
    var type = "/type/article"; // $('#create_document select[name=document_type]').val();
    
    this.checkDocumentName(name, function(valid) {
      if (valid) {
        that.document.newDocument(type, name, title);
      } else {
        $('#create_document input[name=new_document_name]').addClass('error');
        $('#new_document_name_message').html('This document name is already taken.');
      }
    });
    
    return false;
  },
  
  toggleEditMode: function(e) {
    var user = app.document.model.get('creator').get('username');
    var name = app.document.model.get('name');
    
    app.document.loadDocument(user, name, null, null, 'edit');
    return false;
  },
  
  toggleShowMode: function(e) {
    var user = app.document.model.get('creator').get('username');
    var name = app.document.model.get('name');
    
    app.document.loadDocument(user, name, null, null, 'show');
    return false;
  },
  
  loadDocument: function(e) {
      var user = $(e.currentTarget).attr('user');
          name = $(e.currentTarget).attr('name');

      app.document.loadDocument(user, name, null,  null);
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
    
    // Reset when clicking on the body
    $('body').click(function(e) {
      app.document.reset(true);
      return true;
    });
    
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
    
    setInterval(function() {
      that.loadNotifications();
    }, 30000);
    
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
      if (head.browser.opera && head.browser.version > "11.0") {
        return true;
      }
      // if (head.browser.msie && head.browser.version > "9.0") {
      //   return true;
      // }
      return false;
    }
    
    if (!browserSupported()) {
      $('#container').html(_.tpl('browser_not_supported'));
      $('#container').show();
      return;
    }
    
    $('#container').show();
    


    // window.positionBoard = function() {
    //   var wrapper = document.getElementById('document_wrapper');
    //   if (wrapper.offsetTop - _.scrollTop() < 0) {
    //     $('#document .board').addClass('docked');
    //     $('#document .board').css('left', ($('#document').offset().left)+'px');
    //     $('#document .board').css('width', ($('#document').width())+'px');
    //     
    //     var tocOffset = $('#toc_wrapper').offset();
    //     if (tocOffset && _.scrollTop() < tocOffset.top) {
    //       $('#toc_wrapper').css('top', _.scrollTop()-$('#document').offset().top+"px");
    //     }
    //     
    //   } else {
    //     $('#document .board').css('left', '');
    //     $('#toc_wrapper').css('top', 0);
    //     $('#document .board').removeClass('docked');
    //   }
    // }
    // 
    // positionBoard();
    // 
    // $(window).bind('scroll', positionBoard);
    // $(window).bind('resize', positionBoard);

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
    function confirmExit() {
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
          $('#sync_state').fadeIn(100);
          graph.sync(function(err, invalidNodes) {
            pendingSync = false;
            if (!err && invalidNodes.length === 0) {
              setTimeout(function() {
                $('#sync_state').fadeOut(100);
              }, 1500);
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