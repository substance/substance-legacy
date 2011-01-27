// The Application
// ---------------

// This is the top-level piece of UI.
var Application = Backbone.View.extend({
  events: {
    'click .toggle-new-document': 'toggleNewDocument',
    'click a.scroll-to': 'triggerScrollTo',
    'click .new-document': 'newDocument',
    'click #dashboard_toggle': 'showDashboard',
    'click #document_toggle': 'showDocument',
    'click a.load-document': 'loadDocument',
    'click a.save-document': 'saveDocument',
    'click a.login': 'toggleLogin',
    'click a.logout': 'logout',
    'click a.signup': 'toggleSignup',
    'click a.show-attributes': 'showAttributes',
    'click a.publish-document': 'publishDocument',
    'click a.unpublish-document': 'unpublishDocument',
    'submit #create_document': 'createDocument',
    'submit #login-form': 'login',
    'click a.delete-document': 'deleteDocument',
    'click a.view-collaborators': 'viewCollaborators',
    'click a.toggle-document-views': 'toggleDocumentViews',
    'click a.toggle-mode': 'toggleMode',
  },

  login: function(e) {
    this.authenticate();
    return false;
  },
  
  toggleDocumentViews: function(e) {
    this.$('#document_view_selection').slideToggle();
    return false;
  },
  
  triggerScrollTo: function(e) {
    this.scrollTo($(e.currentTarget).attr('href'));
    return false;
  },
  
  toggleLogin: function() {
    $('#signup').hide();
    $('#login').toggle();
    this.scrollTo('#container');
    return false;
  },
  
  toggleNewDocument: function() {
    this.document.closeDocument();
    return false;
  },
  
  toggleSignup: function() {
    var that = this;
    
    $('#login').hide();
    $('#signup').toggle();

    $('#signup-form').unbind();
    $('#signup-form').submit(function() {
       that.registerUser();
      return false;
    });
    return false;
  },
  
  newDocument: function(e) {
    $('#create_document input[name=document_type]').val($(e.currentTarget).attr('type'));
    $('#document_type_selection').hide();
    $('#create_document').show();
    return false;
  },
  
  createDocument: function(e) {
    var name = $('#create_document input[name=new_document_name]').val();
    var type = $('#create_document input[name=document_type]').val();
    
    
    if (new RegExp(graph.get('/type/document').get('properties', 'name').validator).test(name))
      this.document.newDocument(type, name);
    else {
      $('#create_document input[name=new_document_name]').addClass('error');
    }
    return false;
  },
  
  toggleMode: function(e) {
    var user = app.document.model.get('creator').get('username');
    var name = app.document.model.get('name');
    app.document.loadDocument(user, name, null, app.document.mode === 'show' ? 'edit' : 'show');
    return false;
  },
  
  loadDocument: function(e) {
      var user = $(e.currentTarget).attr('user');
          name = $(e.currentTarget).attr('name');

      app.document.loadDocument(user, name);
      if (controller) controller.saveLocation($(e.currentTarget).attr('href'));
    return false;
  },
  
  // Handle top level events
  // -------------
  
  showAttributes: function() {
    app.document.drawer.toggle('Attributes');
    $('.show-attributes').toggleClass('selected');
    return false;
  },
  
  publishDocument: function(e) {
    this.document.model.set({
      published_on: (new Date()).toJSON()
    });
    this.document.attributes.render();
    return false;
  },
  
  unpublishDocument: function(e) {
    this.document.model.set({
      published_on: null
    });
    
    this.document.attributes.render();
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
        that.browser.render();
        that.render();
        controller.saveLocation('');
      }
    });
    return false;
  },
  
  deleteDocument: function(e) {
    if (confirm('Are you sure to delete this document?')) {
      this.document.deleteDocument($(e.target).attr('document'));
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
    return this.authenticated ? {"type|=": ["/type/document"], "creator": "/user/"+this.username }
                              : {"type|=": ["/type/document"], "creator": "/user/demo"}
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
    this.activeUsers = [];
    
    // Cookie-based auto-authentication
    if (session.username) {
      graph.merge(session.seed);
      this.authenticated = true;
      this.username = session.username;
      this.trigger('authenticated');
    } else {
      this.authenticated = false;
    }
    
    // Try to establish a server connection
    // this.connect();
    // this.bind('connected', function() {
    //   notifier.notify(Notifications.CONNECTED);
    // });
    
    that.render();

    this.bind('authenticated', function() {
      that.authenticated = true;
      // Re-render browser
      that.render();
      that.document.closeDocument();
      that.browser.load(that.query());
      controller.saveLocation('#'+that.username);
    });
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
          notifier.notify(Notifications.AUTHENTICATED);
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
  
  // Scroll to an element
  scrollTo: function(selector) {
    var offset = $(selector).offset();
    offset ? $('html, body').animate({scrollTop: offset.top}, 'slow') : null;
    return false;
  },
  
  registerUser: function() {
    var that = this;
    
    $.ajax({
      type: "POST",
      url: "/register",
      data: {
        username: $('#signup-user').val(),
        name: $('#signup-name').val(),
        email: $('#signup-email').val(),
        password: $('#signup-password').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.status === 'error') {
          notifier.notify({
            message: res.message,
            type: 'error'
          });
          // return notifier.notify(Notifications.AUTHENTICATION_FAILED);
        } else {
          graph.merge(res.seed);
          notifier.notify(Notifications.AUTHENTICATED);
          that.username = res.username;
          that.trigger('authenticated');
        }
      },
      error: function(err) {
        notifier.notify(Notifications.AUTHENTICATION_FAILED);
      }
    });
  },
  
  sync: function() {
    graph.sync(function(err, invalidNodes) {
      if (err) {
        notifier.notify(Notifications.DOCUMENT_SAVING_FAILED);
      } else {
        notifier.notify(Notifications.DOCUMENT_SAVED);
      }
    });
  },
  
  // Should be rendered just once
  render: function() {
    var that = this;
    
    // Browser not supported
    if (window.WebSocket === undefined) {
      $(this.el).html(Helpers.renderTemplate('browser_not_supported'));
    } else {
      this.document.render();
    }
    return this;
  }
});

Data.setAdapter('AjaxAdapter');

var remote,                              // Remote handle for server-side methods
    app,                                 // The Application
    controller,                          // Controller responding to routes
    editor,                              // A global instance of the Proper Richtext editor
    graph = new Data.Graph(seed, false); // The database


(function() {
  $(function() {
    
    function scrollTop() {
      return document.body.scrollTop || document.documentElement.scrollTop;
    }
    
    window.positionDocumentMenu = function() {
      var document_wrapper = document.getElementById('document_wrapper');
      var menu = $('#document_menu');
      
      var val = document_wrapper.offsetTop - scrollTop()-50;
      if (val < 0) {
        $('#document_menu').addClass('docked');
        $('#document_menu').css('top', 50);
      } else {
        if (val < window.innerHeight-100) {
          $('#document_menu').removeClass('docked');
          $('#document_menu').css('top', 0);
        } else {
          $('#document_menu').addClass('docked');
          $('#document_menu').css('top', window.innerHeight-50);
        }
      }
    }
    
    $(window).bind('scroll', positionDocumentMenu);
    $(window).bind('resize', positionDocumentMenu);
    
    // Start the engines
    app = new Application({el: $('#container'), session: session});
    
    // Set up a global instance of the Proper Richtext Editor
    editor = new Proper();
    
    // Initialize controller
    controller = new ApplicationController({app: this});
    
    // Start responding to routes
    Backbone.history.start();
    
    var pendingSync = false;
    graph.bind('dirty', function() {
      // Reload document browser
      app.browser.render();
      
      if (!pendingSync) {
        pendingSync = true;
        setTimeout(function() {
          notifier.notify(Notifications.SYNCHRONIZING);
          graph.sync(function(err, invalidNodes) {
            if (!err && invalidNodes.length === 0) {
              notifier.notify(Notifications.SYNCHRONIZED);
              pendingSync = false;
            } else {
              if (invalidNodes) console.log(invalidNodes.keys());
              console.log(err);
              notifier.notify({
                message: err || 'Not all nodes could be saved successfully.',
                type: 'error'
              });
            }
          });
        }, 3000);
      }
    });
    
    graph.bind('conflicted', function() {
      if (!app.document.model) return;
      graph.fetch({
        creator: app.document.model.get('creator')._id,
        name: app.document.model.get('name')
      }, {expand: true}, function(err) {
        app.document.render();
        app.scrollTo('#document_wrapper');
      });
      notifier.notify({
        message: 'There are conflicting nodes. The Document will be reset for your own safety.',
        type: 'error'
      });

    });
  });
})();