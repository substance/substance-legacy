// The Application
// ---------------

// This is the top-level piece of UI.
var Application = Backbone.View.extend({
  events: {
    'click a.new-document': 'newDocument',
    'click a.save-document': 'saveDocument',
    'click a.delete-document': 'deleteDocument',
    'click a.logout': 'logout'
  },

  initialize: function() {
    var that = this;
    
    _.bindAll(this, "render");
    
    // Set up shelf
    this.shelf = new Shelf({el: '#lpl_shelf'});
    this.drawer = new Drawer({el: '#drawer'});
    
    this.authenticated = false;
    
    // Initialize controller
    this.controller = new ApplicationController({app: this});
    
    // Try to establish a server connection
    this.connect();
    
    this.bind('connected', function() {
      notifier.notify(Notifications.CONNECTED);
      
      remote.Session.init({
        success: function() { // auto-authenticated
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
      
      // Start with a blank document
      that.newDocument();
      
      // Start responding to routes
      Backbone.history.start();
      
    });
    
    this.bind('status:changed', function() {
      that.shelf.render();
    });
        
    this.bind('document:changed', function() {
      document.title = that.model.data.title;
      // Re-render shelf and drawer
      that.shelf.render();
      that.drawer.render();
    });
  },
  
  connect: function() {
    var that = this;
    
    DNode({
      Session: {
        updateStatus: function(status) {
          that.status = status;
          that.trigger('status:changed');
        },
        
        updateNode: function(key, node) {
          app.model.updateNode(key, node);
        },
        
        moveNode: function(sourceKey, targetKey, destination) {
          app.model.moveNode(sourceKey, targetKey, destination);
        },
        
        insertNode: function(insertionType, type, targetKey, destination) {
          if (insertionType === 'sibling') {
            if (destination === 'before') {
              app.model.createSiblingBefore(type, targetKey);
            } else { // destination === 'after'
              app.model.createSiblingAfter(type, targetKey);
            }
          } else { // inserionType === 'child'
            app.model.createChild(type, targetKey);
          }
        },
        
        removeNode: function(key) {
          app.model.removeNode(key);
        },
        
        // The server asks for the current (real-time) version of the document
        getDocument: function(options) {
          options.success(that.model.serialize()); // Call em back, and deliver the stuff
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
  
  logout: function() {
    var that = this;
    remote.Session.logout({
      success: function() {
        that.authenticated = false;
        that.render();
      }
    });
  },
  
  newDocument: function() {
    this.model = new Document(JSON.parse(JSON.stringify(Document.EMPTY)));
    this.init();
    this.trigger('document:changed');
    this.shelf.close();
    
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },
  
  saveDocument: function() {
    var that = this;
    
    notifier.notify(Notifications.DOCUMENT_SAVING);
    
    if (that.model.id) { // Update
      remote.Document.update(that.model.id, that.model.serialize(), {
        success: function() {
          notifier.notify(Notifications.DOCUMENT_SAVED);
        },
        error: function() {
          notifier.notify(Notifications.DOCUMENT_SAVING_FAILED);
        }
      });
    } else { // Create
      remote.Document.create(that.model.serialize(), {
        success: function() {
          notifier.notify(Notifications.DOCUMENT_SAVED);
        },
        error: function() {
          notifier.notify(Notifications.DOCUMENT_SAVING_FAILED);
        }
      });
    }
  },
  
  loadDocument: function(id) {
    var that = this;
    
    notifier.notify(Notifications.DOCUMENT_LOADING);
    
    remote.Session.getDocument(id, {
      success: function(doc) {       
        that.model = new Document(doc);
        that.render();
        that.init();
        that.trigger('document:changed');
        
        notifier.notify(Notifications.DOCUMENT_LOADED);
        
        remote.Session.registerDocument(id);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_LOADING_FAILED);
      }
    });
    this.shelf.close();
  },
  
  deleteDocument: function(e) {
    var that = this;
    
    notifier.notify(Notifications.DOCUMENT_DELETING);
    
    remote.Document.destroy(this.model.id, {
      success: function() {
        app.newDocument();
        notifier.notify(Notifications.DOCUMENT_DELETED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_DELETING_FAILED);
      }
    });
  },
  
  // Initializes the editor (with a new document)
  init: function() {
    var that = this;
    
    // Inject node editor on every select:node
    this.model.unbind('select:node');
    this.model.bind('select:node', function(node) {
      that.drawer.renderNodeEditor();
    });
    
    this.renderDocumentView();
  },
  
  // Should be rendered just once
  render: function() {
    
    
    var that = this;
    // Browser not supported
    if (!window.WebSocket) {
      $(this.el).html(Helpers.renderTemplate('browser_not_supported'));
    } else {
      if (this.authenticated) {
        $(this.el).html(Helpers.renderTemplate('editor'));

        // Render Shelf
        this.shelf.render();

        // Render Drawer
        this.drawer.render();        
      } else { // Display landing page
        $(this.el).html(Helpers.renderTemplate('signup'));
        $('#login-form').submit(function() {
          that.authenticate();
          return false;
        });
      }
    }
    return this;
  },
  
  renderDocumentBrowser: function() {
    this.documentBrowser = new DocumentBrowser({el: this.$('#shelf'), model: this.model, composer: this});
    this.documentBrowser.render();
  },
    
  renderDocumentView: function(g) {
    this.documentView = new DocumentView({el: this.$('#document'), model: this.model});
    this.documentView.render();
  }
});

var remote,   // Remote handle for server-side methods
    notifier, // Global notifiction system
    app;      // The Application

(function() {
  $(function() {
    // Set up a notifier for status-message communication
    notifier = new Backbone.Notifier();
    
    // Start the engines
    app = new Application({el: $('#container')});
  });
})();