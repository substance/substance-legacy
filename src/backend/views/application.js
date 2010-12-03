// The Application
// ---------------

// This is the top-level piece of UI.
var Application = Backbone.View.extend({
  events: {
    'click a.new-document': 'newDocument',
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
    
    // Try to establish a server connection
    this.connect();
    
    this.bind('connected', function() {
      notifier.notify(Notifications.CONNECTED);
      
      remote.Session.init({
        success: function(username) { // auto-authenticated
          that.username = username;
          that.trigger('authenticated');
          
          // Start responding to routes
          Backbone.history.start();
        },
        error: function() {
          // Render landing page
          that.render();
          
          // Start responding to routes
          Backbone.history.start();
        }
      });
    });
    
    this.bind('authenticated', function() {
      that.authenticated = true;

      // Re-render
      that.render();
      
      // Start with a blank document
      that.newDocument();
      
    });
    
    this.bind('status:changed', function() {
      that.shelf.render();
      app.outline.refresh();
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
    this.status = null;
    this.init();
    this.trigger('document:changed');
    this.shelf.close();
    
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },
  
  createDocument: function(name) {
    var that = this;
    remote.Document.create(this.username, name, this.model.serialize(), {
      success: function() {
        that.model.id = 'users:'+that.username + ':documents:' + name;
        that.model.author = that.username;
        that.model.name = name;
        that.trigger('document:changed');
        notifier.notify(Notifications.DOCUMENT_SAVED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_SAVING_FAILED);
      }
    });
  },
  
  saveDocument: function() {
    var that = this;
    
    notifier.notify(Notifications.DOCUMENT_SAVING);
    remote.Document.update(that.model.id, that.model.serialize(), {
      success: function() {
        notifier.notify(Notifications.DOCUMENT_SAVED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_SAVING_FAILED);
      }
    });
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
      // that.$('.content-node.selected').removeClass('selected');
      that.documentView.resetSelection();
      $('#'+node.key).addClass('selected');
      $('#document').addClass('edit-mode');
      that.drawer.renderNodeEditor();
      app.outline.refresh();
    });
    
    this.renderDocumentView();
    
    // Render outline
    this.outline = new Outline(that.model);
    this.outline.render();
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
        $(this.el).html(Helpers.renderTemplate('login'));
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
    $(this.el).html(Helpers.renderTemplate('signup'));
    $('#signup-form').submit(function() {
      that.registerUser();
      return false;
    });
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

var remote,     // Remote handle for server-side methods
    notifier,   // Global notifiction system
    app,        // The Application
    controller; // Controller responding to routes

(function() {
  $(function() {
    // Set up a notifier for status-message communication
    notifier = new Backbone.Notifier();
    
    // Start the engines
    app = new Application({el: $('#container')});
    
    // Initialize controller
    controller = new ApplicationController({app: this});

  });
})();