function addEmptyDoc() {
  var doc = graph.set(Data.uuid('/document/'+ app.username +'/'), {
    "type": "/type/document",
    "title": "Untitled",
    "user": "/user/michael",
    "children": [
    
      // Section 1
      {
        "type": "/type/section",
        "name": "Section 1",
        "children": []
      },
      
      // Section 2
      {
        "type": "/type/section",
        "name": "Section 2",
        "children": [
        
          // Text 1
          {
            "type": "/type/text",
            "content": "Some text"
          },
          
          // Text 2
          {
            "type": "/type/text",
            "content": "Another text"            
          }
        ]
      }
    ]
  });
  
  return doc;
};



// The Document Editor View

var Editor = Backbone.View.extend({
  
  initialize: function() {
    var that = this;
    this.drawer = new Drawer({el: '#drawer'});
    
    this.bind('status:changed', function() {
      app.shelf.render();
      app.toggleView('editor'); // TODO: ugly
      
      that.updateCursors();
    });
    
    this.bind('document:changed', function() {
      document.title = that.model.data.title;
      
      // Re-render shelf and drawer
      app.shelf.render();
      app.toggleView('editor'); // TODO: ugly
      that.drawer.renderContent(); // Refresh attributes et. al
      that.drawer.render();
    });
  },
  
  updateCursors: function() {
    $('.content-node.occupied').removeClass('occupied');
    _.each(this.status.cursors, function(user, nodeKey) {
      $('#'+nodeKey).addClass('occupied');
      $('#'+nodeKey+' .cursor span').html(user);
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
      
      // Deactivate Richtext Editor
      editor.deactivate();
      
      // Render inline Node editor
      that.documentView.renderNodeEditor(node);
    });
    
    // set up document view
    this.documentView = new DocumentView({el: this.$('#document'), model: this.model});
    this.documentView.render();
  },
  
  newDocument: function() {
    this.model = addEmptyDoc();
    
    this.status = null;
    $(this.el).show();
    $('#dashboard').hide();
    
    this.init();
    this.trigger('document:changed');
    $('#main').removeClass('drawer-opened');
    app.shelf.close();
    
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },
  
  loadDocument: function(username, docname) {
    var that = this;
    notifier.notify(Notifications.DOCUMENT_LOADING);
    
    function getDocumentId(g) {
      var id;
      _.each(g, function(node, key) {
        if (node.type === '/type/document') id = key;
      });
      return id;
    };
    
    graph.fetch({user: '/user/'+username, name: docname}, {expand: true}, function(err, g) {
      if (!err) {
        var id = getDocumentId(g);
        that.model = graph.get(id);
        that.render();
        
        app.toggleView('document');
        that.init();
        that.trigger('document:changed');
      
        // TODO: Not exactly pretty to do this twice
        app.toggleView('document');
        $('#main').removeClass('drawer-opened');
        
        notifier.notify(Notifications.DOCUMENT_LOADED);
        remote.Session.registerDocument(id);
      } else {
        notifier.notify(Notifications.DOCUMENT_LOADING_FAILED);
      }
    });
  },
  
  // Create a new document
  // -------------
  
  createDocument: function(name) {
    var that = this;
    
    this.model.set({
      name: name,
      created_at: new Date(),
      updated_at: new Date(),
      published_on: null
    });

    notifier.notify(Notifications.DOCUMENT_SAVING);
    
    graph.save(function(err) {      
      err ? notifier.notify(Notifications.DOCUMENT_SAVING_FAILED)
          : notifier.notify(Notifications.DOCUMENT_SAVED);
    });
    
    return false;
  },
  
  // Store an existing document
  // -------------
  
  saveDocument: function() {
    var that = this;
    
    this.model.set({
      updated_at: new Date()
    });

    notifier.notify(Notifications.DOCUMENT_SAVING);
    
    graph.save(function(err) {      
      err ? notifier.notify(Notifications.DOCUMENT_SAVING_FAILED)
          : notifier.notify(Notifications.DOCUMENT_SAVED);
    });
  },
  
  // Delete an existing document, given that the user is authorized
  // -------------
  
  // deleteDocument: function(id) {
  //   var that = this;
  // 
  //   notifier.notify(Notifications.DOCUMENT_DELETING);
  //   
  //   remote.Document.destroy(id, {
  //     success: function() {
  //       app.dashboard.load(); // Reload documents at the dashboard
  //       notifier.notify(Notifications.DOCUMENT_DELETED);
  //     },
  //     error: function() {
  //       notifier.notify(Notifications.DOCUMENT_DELETING_FAILED);
  //     }
  //   });
  // }
});