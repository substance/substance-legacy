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
    'submit #create-document-form': 'createDocument',
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
    this.document.newDocument($(e.currentTarget).attr('type'));
    this.$('.document-type-selection').hide();
    return false;
  },
  
  loadDocument: function(e) {
      var user = $(e.currentTarget).attr('user');
          name = $(e.currentTarget).attr('name');
                
      app.document.loadDocument(user, name);
      controller.saveLocation($(e.currentTarget).attr('href'));
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
    this.document.saveDocument();
    return false;
  },
  
  unpublishDocument: function(e) {
    this.document.model.set({
      published_on: null
    });
    
    this.document.attributes.render();
    this.document.saveDocument();
    return false;
  },
  
  // TODO: clean up this mess
  saveDocument: function(e) {
    var that = this;
    var qry = {"type|=": "/type/document", "name": $('#document_name').val(), "creator": "/user/"+app.username};
    
    function saveDoc() {
      that.document.model.set({
        name: $('#document_name').val(),
        created_at: that.document.model.get('created_at') || new Date(),
        updated_at: new Date(),
        published_on: that.document.model.get('published_on') || null
      });
            
      that.document.model.validate() 
        ? that.document.saveDocument()
        : notifier.notify(Notifications.DOCUMENT_INVALID);
    }
    
    if (that.document.model.get('name') !== $('#document_name').val()) { // Name change
      graph.fetch(qry, {}, function(err) {
        if (graph.find(qry).length > 0) {
          notifier.notify(Notifications.DOCUMENT_ALREADY_EXISTS);
        } else {
          saveDoc();
        }
      });
    } else {
      saveDoc();      
    }
    return false;
  },
  
  createDocument: function(e) {
    app.document.createDocument($('#document_name').val());
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
      
      remote.Session.init({
        success: function(username, status) { // auto-authenticated
          that.username = username;
          that.updateSystemStatus(status);
          that.trigger('authenticated');
          
          // Initialize controller
          controller = new ApplicationController({app: this});

          // Start responding to routes
          Backbone.history.start();
        },
        error: function() {
          // Render landing page
          that.render();
          
          // Initialize controller
          controller = new ApplicationController({app: this});

          // Start responding to routes
          Backbone.history.start();
        }
      });
    });
    
    this.bind('authenticated', function() {
      that.authenticated = true;
      
      // Re-render #browser_menu
      that.render();
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
    
    $(window).bind('scroll', positionDocumentMenu);
    $(window).bind('resize', positionDocumentMenu);
  });
})();