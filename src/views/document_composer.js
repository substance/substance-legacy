// The Application
// ---------------

// This is the top-level piece of UI.
var DocumentComposer = Backbone.View.extend({
  events: {
    'click a.new-document': 'newDocument',
    'click a.browse-documents': 'browseDocuments',
    'click a.save-document': 'saveDocument',
  },

  initialize: function() {
    var that = this;
    _.bindAll(this, "render");
    
    this.menu = new Menu({el: '#menubar', model: this.model, composer: this});
    
    this.bind('document:changed', function() {
      that.menu.model = that.model;
      that.menu.render();
    });
  },
  
  newDocument: function() {
    // Create a new document and add it to the Documents Collection
    this.model = new Document({
      contents: Document.EMPTY
    });
    
    Documents.add(this.model);
    
    this.init();
    this.trigger('document:changed');
    
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },
  
  saveDocument: function() {
    var that = this;
    
    notifier.notify(Notifications.DOCUMENT_SAVING);

    this.model.save({}, {
      success: function() {
        notifier.notify(Notifications.DOCUMENT_SAVED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_SAVING_FAILED);
      },
    });
  },
  
  loadDocument: function(id) {
    var that = this;
    
    this.model = new Document({
      id: id,
      contents: Document.EMPTY
    });
    
    notifier.notify(Notifications.DOCUMENT_LOADING);
    
    this.model.fetch({
      success: function() {
        that.init();
        that.trigger('document:changed');
        notifier.notify(Notifications.DOCUMENT_LOADED);
        
        // Register at ContentNodeDispatcher
        socket.send({
          type: "register",
          body: {
            id: that.model.id
          }
        });
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENT_LOADING_FAILED);
      }
    });
    
    $('#shelf').html('');
  },
  
  browseDocuments: function() {
    var that = this;
    // Load all documents available in the Repository
    // and render DocumentBrowser View
    
    notifier.notify(Notifications.DOCUMENTS_LOADING);
    
    Documents.fetch({
      success: function() {
        that.renderDocumentBrowser();
        notifier.notify(Notifications.DOCUMENTS_LOADED);
      },
      error: function() {
        notifier.notify(Notifications.DOCUMENTS_LOADING_FAILED);
      }
    });
  },
  
  // Initializes the editor (with a new document)
  init: function() {
    var that = this;
    
    // Inject node editor on every select:node
    this.model.unbind('select:node');
    this.model.bind('select:node', function(node) {
      that.renderNodeEditor();
    });
    
    this.renderDocumentView();
  },
  
  // Should be rendered just once
  render: function() {
    $(this.el).html(Helpers.renderTemplate('editor'));
    
    // Render Menu
    this.menu.render();
    return this;
  },
  
  renderDocumentBrowser: function() {
    this.documentBrowser = new DocumentBrowser({el: this.$('#shelf'), model: this.model, composer: this});
    this.documentBrowser.render();
  },
  
  renderNodeEditor: function() {
    // Depending on the selected node's type, render the right editor
    if (this.model.selectedNode.type === 'document') {
      this.nodeEditor = new DocumentEditor({el: this.$('#editor'), model: this.model});
    } else if (this.model.selectedNode.type === 'paragraph') {
      this.nodeEditor = new ParagraphEditor({el: this.$('#editor'), model: this.model});
    } else if (this.model.selectedNode.type === 'section') {
      this.nodeEditor = new SectionEditor({el: this.$('#editor'), model: this.model});
    } else if (this.model.selectedNode.type === 'image') {
      this.nodeEditor = new ImageEditor({el: this.$('#editor'), model: this.model});
    }
  },
  
  renderDocumentView: function(g) {
    this.documentView = new DocumentView({el: this.$('#document'), model: this.model});
    this.documentView.render();
  }
});