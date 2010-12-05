// The Document Editor View

var Editor = Backbone.View.extend({
  
  initialize: function() {
    var that = this;
    this.drawer = new Drawer({el: '#drawer'});
    
    this.bind('status:changed', function() {
      app.shelf.render();
      app.toggleView('editor'); // TODO: ugly
      that.outline.refresh();
    });
    
    this.bind('document:changed', function() {
      document.title = that.model.data.title;
      
      // Re-render shelf and drawer
      app.shelf.render();
      app.toggleView('editor'); // TODO: ugly
      that.drawer.render();
    });
  },
  
  render: function() {    
    // Render all relevant sub views
    $(this.el).html(Helpers.renderTemplate('editor'));
    
    // Render Shelf
    app.shelf.render();
    
    // Render Drawer
    this.drawer.render();
  },
  
  init: function() {
    var that = this;
    
    // Inject node editor on every select:node
    this.model.unbind('select:node');
    this.model.bind('select:node', function(node) {
      that.documentView.resetSelection();
      $('#'+node.key).addClass('selected');
      $('#document').addClass('edit-mode');
      that.drawer.renderNodeEditor();
      app.editor.outline.refresh();
    });
    
    // set up document view
    this.documentView = new DocumentView({el: this.$('#document'), model: this.model});
    this.documentView.render();
    
    // Render outline
    this.outline = new Outline(that.model);
    this.outline.render();
  },
  
  newDocument: function() {
    this.model = new Document(JSON.parse(JSON.stringify(Document.EMPTY)));
    this.status = null;
    
    $(this.el).show();
    $('#dashboard').hide();
    
    this.init();
    this.trigger('document:changed');
    app.shelf.close();
    
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },
  
  loadDocument: function(id) {
    var that = this;
    notifier.notify(Notifications.DOCUMENT_LOADING);
    
    remote.Session.getDocument(id, {
      success: function(doc) {    
        that.model = new Document(doc);
        
        that.render();
        
        app.toggleView('document');
        that.init();
        
        that.trigger('document:changed');
        
        // TODO: Not exactly pretty to do this twice
        app.toggleView('document'); 
        
        notifier.notify(Notifications.DOCUMENT_LOADED);
        remote.Session.registerDocument(id);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_LOADING_FAILED);
      }
    });
    app.shelf.close();
  },
  
  // Create a new document
  // -------------
  
  createDocument: function(name) {
    var that = this;
    
    remote.Document.create(app.username, name, this.model.serialize(), {
      success: function() {
        that.model.id = 'users:'+app.username + ':documents:' + name;
        that.model.author = app.username;
        that.model.name = name;
        that.trigger('document:changed');
        notifier.notify(Notifications.DOCUMENT_SAVED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_SAVING_FAILED);
      }
    });
  },
  
  // Store an existing document
  // -------------
  
  saveDocument: function() {
    var that = this;
    
    notifier.notify(Notifications.DOCUMENT_SAVING);
    remote.Document.update(that.model.author, that.model.name, that.model.serialize(), {
      success: function() {
        notifier.notify(Notifications.DOCUMENT_SAVED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_SAVING_FAILED);
      }
    });
  },
  
  // Delete an existing document, given that the user is authorized
  // -------------
  
  deleteDocument: function(id) {
    var that = this;
    
    notifier.notify(Notifications.DOCUMENT_DELETING);
    
    remote.Document.destroy(id, {
      success: function() {
        // app.newDocument();
        app.dashboard.load(); // Reload documents at the dashboard
        
        notifier.notify(Notifications.DOCUMENT_DELETED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_DELETING_FAILED);
      }
    });
  }
});