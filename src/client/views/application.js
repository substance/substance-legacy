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
    'click a.view-collaborators': 'viewCollaborators'
  },

  login: function(e) {
    this.authenticate();
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

    this.document.newDocument(type, name);
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
    remote.Session.logout({
      success: function() {
        that.username = null;
        that.authenticated = false;
        that.document.closeDocument();
        that.browser.render();
        that.render();
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
  
  initialize: function() {
    var that = this,
        query = this.authenticated ? {"type|=": ["/type/document"], "creator": "/user/"+this.username }
                                  : {"type|=": ["/type/document"]}
    _.bindAll(this, "render");
    
    // Initialize browser
    this.browser = new DocumentBrowser({
      el: this.$('#browser_wrapper'),
      query: query
    });
    
    this.document = new Document({el: '#document_wrapper'});
    this.activeUsers = [];
    this.authenticated = false;
    
    // Try to establish a server connection
    this.connect();
    
    this.bind('connected', function() {
      notifier.notify(Notifications.CONNECTED);
            
      remote.Session.init(function(err, username, status) {
        if (err) { // Landing page
          that.render();          
        } else { // Auto-authenticated
          that.username = username;
          that.updateSystemStatus(status);
          that.trigger('authenticated');
        }
        
        // Initialize controller
        controller = new ApplicationController({app: this});
        
        // Start responding to routes
        Backbone.history.start();
      });
    });
    
    this.bind('authenticated', function() {
      that.authenticated = true;
      
      // Re-render browser
      that.render();
      that.browser.load();
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

    remote.Session.authenticate($('#login-user').val(), $('#login-password').val(), {
      success: function(username, status) { 
        notifier.notify(Notifications.AUTHENTICATED);
        that.username = username;
        that.updateSystemStatus(status);
        that.trigger('authenticated');
      },
      error: function() {
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
    
    remote.Session.registerUser($('#signup-user').val(), $('#signup-email').val(), $('#signup-password').val(), {
      success: function(username, status) { 
        notifier.notify(Notifications.AUTHENTICATED);
        that.username = username;
        that.updateSystemStatus(status);
        that.trigger('authenticated');
      },
      error: function() {
        notifier.notify(Notifications.SIGNUP_FAILED);
      }
    });
  },
  
  sync: function() {
    graph.sync(function(err, invalidNodes) {
      if (err) {
        console.log(invalidNodes);
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

var remote,                       // Remote handle for server-side methods
    app,                          // The Application
    controller,                   // Controller responding to routes
    editor,                       // A global instance of the Proper Richtext editor
    graph = new Data.Graph(seed); // The database

(function() {
  $(function() {
    // Start the engines
    app = new Application({el: $('#container')});
    
    // Set up a global instance of the Proper Richtext Editor
    editor = new Proper();
    
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
    
    var pendingSync = false;
    graph.bind('dirty', function() {
      // Reload document browser
      app.browser.render();
      
      if (!pendingSync) {
        pendingSync = true;
        setTimeout(function() {
          notifier.notify(Notifications.SYNCHRONIZING);
          graph.sync(function(err, invalidNodes) {
            notifier.notify(Notifications.SYNCHRONIZED);
            pendingSync = false;
          });
        }, 3000);
      }
    });
    
    $(window).bind('scroll', positionDocumentMenu);
    $(window).bind('resize', positionDocumentMenu);
  });
})();