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
    'click a.show-attributes': 'showAttributes',
    'click a.publish-document': 'publishDocument',
    'click a.unpublish-document': 'unpublishDocument',
    'submit #create-document-form': 'createDocument',
    'click a.delete-document': 'deleteDocument',
    'click a.logout': 'logout',
    'click a.signup': 'renderSignupForm',
    'click a.view-collaborators': 'viewCollaborators'
  },
  
  view: 'dashboard', // init state
  
  toggleNewDocument: function() {
    this.$('.document-type-selection').toggle();
    return false;
  },
  
  newDocument: function(e) {
    
    this.editor.newDocument($(e.currentTarget).attr('type'));
    return false;
  },
  
  loadDocument: function(e) {
    // if (app.authenticated) {
      var user = $(e.currentTarget).attr('user');
          name = $(e.currentTarget).attr('name');
                
      app.editor.loadDocument(user, name);
      controller.saveLocation($(e.currentTarget).attr('href'));
    // }
    return false;
  },
  
  showDashboard: function() {
    this.toggleView('dashboard');
    return false;
  },
  
  showDocument: function() {
    this.toggleView('document');
    return false;
  },
  
  // Handle top level events
  // -------------
  
  showAttributes: function() {
    app.editor.drawer.toggle('Attributes');
    $('.show-attributes').toggleClass('selected');
    return false;
  },
  
  publishDocument: function(e) {
    this.editor.model.set({
      published_on: (new Date()).toJSON()
    });
    this.editor.drawer.renderContent();
    this.editor.saveDocument();
    return false;
  },
  
  unpublishDocument: function(e) {
    this.editor.model.set({
      published_on: null
    });
    
    this.editor.drawer.renderContent();
    this.editor.saveDocument();
    return false;
  },
  
  saveDocument: function(e) {
    if (this.editor.model.validate()) {
      this.editor.saveDocument();
    } else {
      this.shelf.toggle('CreateDocument', e);
    }
    return false;
  },
  
  createDocument: function(e) {
    app.editor.createDocument(this.shelf.$('#document-name').val());
    // Refresh drawer
    this.editor.drawer.renderContent();
    return false;
  },
  
  logout: function() {
    var that = this;
    remote.Session.logout({
      success: function() {
        that.username = null;
        app.toggleView('dashboard');
        
        that.authenticated = false;
        that.render();
      }
    });
    return false;
  },
  
  deleteDocument: function(e) {
    this.editor.deleteDocument($(e.target).attr('document'));
    return false;
  },
  
  viewCollaborators: function(e) {
    this.shelf.toggle('Collaborators', e);
    return false;
  },
  
  
  // Application Setup
  // -------------
  
  updateSystemStatus: function(status) {
    this.activeUsers = status.active_users;
    // Refreshing the Dashboard all the time is overkill, find a better solution
    // if (this.dashboard) this.dashboard.render();
  },
  
  initialize: function() {
    var that = this;
    
    _.bindAll(this, "render");
    
    // this.dashboard = new Dashboard({el: '#dashboard'});
    
    // Initialize browser
    this.browser = new DocumentBrowser({
      el: this.$('#browser'),
      // query: {"type|=": ["/type/document"], "creator": "/user/"+app.username }
      query: {"type|=": ["/type/document"]}
    });
    
    this.editor = new Editor({el: '#editor'});
    this.activeUsers = [];
    
    // Set up shelf
    this.shelf = new Shelf({el: '#sbs_shelf'});
    
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
        },
        error: function() {
          // Render landing page
          that.render();
        }
      });
    });
    
    this.bind('authenticated', function() {
      that.authenticated = true;
      
      // Re-render
      that.render();
    });
  },
  
  connect: function() {
    var that = this;
    
    DNode({
      Session: {
        updateStatus: function(status) {
          that.editor.status = status;
          that.editor.trigger('status:changed');
        },
        
        updateSystemStatus: function(status) {
          that.updateSystemStatus(status);
        },
        
        updateNode: function(key, node) {
          app.editor.documentView.updateNode(key, node);
        },
        
        moveNode: function(sourceKey, targetKey, parentKey, destination) {
          throw 'Not implemented';
        },
        
        insertNode: function(insertionType, node, targetKey, parentKey, destination) {
          if (insertionType === 'sibling') {
            app.editor.documentView.addSibling(node, targetKey, parentKey, destination);
          } else { // inserionType === 'child'
            app.editor.documentView.addChild(node, targetKey, parentKey, destination);
          }
        },
        
        removeNode: function(key, parentKey) {
          app.editor.documentView.removeNode(key, parentKey);
        },
        
        // The server asks for the current (real-time) version of the document
        getDocument: function(callback) {
          var result = that.getFullDocument(app.editor.model._id);
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
        notifier.notify(Notifications.AUTHENTICATION_FAILED);
      }
    });
  },

  toggleView: function(view) {
    this.view = view;
    
    $('#sbs_header').removeClass();
    
    if (this.view === 'dashboard') {
      editor.deactivate();
      
      $('#dashboard').show();
      $('#editor').hide();
      
      $('#sbs_header').addClass('dashboard');
    } else {
      $('#editor').show();
      $('#dashboard').hide();
      
      $('#sbs_header').addClass('document');
    }
  },
  
  // Should be rendered just once
  render: function() {
    var that = this;
    
    // Browser not supported
    if (window.WebSocket === undefined) {
      $(this.el).html(Helpers.renderTemplate('browser_not_supported'));
    } else {
      // if (this.authenticated) {
      //   this.dashboard.render();
      //   this.editor.render();
      //   this.shelf.render();
      //   
      //   this.toggleView(this.view);
      //   
      // } else { // Display landing page
      //   $('#dashboard').html(Helpers.renderTemplate('login'));
      //   this.shelf.render();
      //   $('#login-form').submit(function() {
      //     that.authenticate();
      //     return false;
      //   });
      // }
      
      this.editor.render();
      this.shelf.render();
    }
    return this;
  },
  
  renderSignupForm: function() {
    var that = this;
    $('#dashboard').html(Helpers.renderTemplate('signup'));
    $('#signup-form').submit(function() {
       that.registerUser();
      return false;
    });
    return false;
  }
});

Data.setAdapter('AjaxAdapter');

var remote,                       // Remote handle for server-side methods
    notifier,                     // Global notifiction system
    app,                          // The Application
    controller,                   // Controller responding to routes
    editor,                       // A global instance of the Proper Richtext editor
    graph = new Data.Graph(seed); // The database

(function() {
  $(function() {
    
    // Set up a notifier for status-message communication
    notifier = new Backbone.Notifier();

    // Start the engines
    app = new Application({el: $('#container')});

    // Initialize controller
    controller = new ApplicationController({app: this});
    
    // Start responding to routes
    Backbone.history.start();
    
    // Set up a global instance of the Proper Richtext Editor
    editor = new Proper();
  });
})();