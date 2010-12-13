// The Application
// ---------------

// This is the top-level piece of UI.
var Application = Backbone.View.extend({
  events: {
    'click .new-document': 'newDocument',
    'click #dashboard_toggle': 'showDashboard',
    'click #document_toggle': 'showDocument',
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
  
  newDocument: function() {
    this.editor.newDocument();
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
    this.editor.model.published_on = (new Date()).toJSON();
    this.editor.saveDocument();
    return false;
  },
  
  unpublishDocument: function(e) {
    this.editor.model.published_on = null;
    this.editor.saveDocument();
    return false;
  },
  
  saveDocument: function(e) {
    if (this.editor.model.id) {
      this.editor.saveDocument();
    } else {
      this.shelf.toggle('CreateDocument', e);
    }
    return false;
  },
  
  createDocument: function(e) {
    app.editor.createDocument(this.shelf.$('#document-name').val());
    this.shelf.close();
    return false;
  },
  
  logout: function() {
    var that = this;
    remote.Session.logout({
      success: function() {
        // Hide shelf actions
        $('#shelf_actions .document').hide();
        $('#shelf_actions .dashboard').hide();
        
        that.authenticated = false;
        that.render();
      }
    });
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
  
  initialize: function() {
    var that = this;
    
    _.bindAll(this, "render");
    
    this.dashboard = new Dashboard({el: '#dashboard'});
    this.editor = new Editor({el: '#editor'});
    
    // Set up shelf
    this.shelf = new Shelf({el: '#sbs_shelf'});
    
    this.authenticated = false;
    
    // Try to establish a server connection
    this.connect();
    
    this.bind('connected', function() {
      notifier.notify(Notifications.CONNECTED);
      
      remote.Session.init({
        success: function(username) { // auto-authenticated
          that.username = username;
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
      
      // Start responding to routes
      Backbone.history.start();
      
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
        
        updateNode: function(key, node) {
          app.editor.model.updateNode(key, node);
        },
        
        moveNode: function(sourceKey, targetKey, destination) {
          app.editor.model.moveNode(sourceKey, targetKey, destination);
        },
        
        insertNode: function(insertionType, type, targetKey, destination) {
          if (insertionType === 'sibling') {
            if (destination === 'before') {
              app.editor.model.createSiblingBefore(type, targetKey);
            } else { // destination === 'after'
              app.editor.model.createSiblingAfter(type, targetKey);
            }
          } else { // inserionType === 'child'
            app.editor.model.createChild(type, targetKey);
          }
        },
        
        removeNode: function(key) {
          app.editor.model.removeNode(key);
        },
        
        // The server asks for the current (real-time) version of the document
        getDocument: function(options) {
          options.success(that.editor.model.serialize()); // Call em back, and deliver the stuff
        }
      }
    }).connect(function (remoteHandle) {
      // For later use store a reference to the remote object
      remote = remoteHandle;      
      that.trigger('connected');
    });
  },
  
  authenticate: function() {
    var that = this;
    
    remote.Session.authenticate($('#login-user').val(), $('#login-password').val(), {
      success: function(username) { 
        notifier.notify(Notifications.AUTHENTICATED);
        that.username = username;
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
      success: function(username) { 
        notifier.notify(Notifications.AUTHENTICATED);
        that.username = username;
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
    if (!window.WebSocket) {
      $(this.el).html(Helpers.renderTemplate('browser_not_supported'));
    } else {
      if (this.authenticated) {
        
        this.dashboard.render();
        this.editor.render();
        this.shelf.render();
        
        this.toggleView(this.view);
        
      } else { // Display landing page
        $('#dashboard').html(Helpers.renderTemplate('login'));
        this.shelf.render();
        $('#login-form').submit(function() {
          that.authenticate();
          return false;
        });
      }
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

var remote,     // Remote handle for server-side methods
    notifier,   // Global notifiction system
    app,        // The Application
    controller, // Controller responding to routes
    editor;     // A global instance of the Proper Richtext editor

(function() {
  $(function() {
    // Set up a notifier for status-message communication
    notifier = new Backbone.Notifier();
    
    // Start the engines
    app = new Application({el: $('#container')});
    
    // Initialize controller
    controller = new ApplicationController({app: this});
    facetController = new FacetController();
    
    // Set up a globals instance of the Proper Richtext Editor
    editor = new Proper();
  });
})();