// The Application
// ---------------

// This is the top-level piece of UI.
var DocumentComposer = Backbone.View.extend({
  events: {
    'click a.new_document': 'newDocument',
    'click a.browse_documents': 'browseDocuments',
    'click a.save_document': 'saveDocument',
    'click a.open_document': 'openDocument'
  },

  initialize: function() {
    var that = this;
    _.bindAll(this, "render");
  },
  
  newDocument: function() {
    // Create a new document and add it to the Documents Collection
    this.model = new Document({
      contents: Document.EMPTY
    });
    
    Documents.add(this.model);
    
    this.init();
    return false;
  },
  
  saveDocument: function() {
    var that = this;
    
    this.model.save({}, {
      success: function() {
        alert('The document has been stored on the server...');
      },
      error: function() {
        alert('Error during saving...');
      },
    });
  },
  
  loadDocument: function(id) {
    var that = this;
    
    this.model = Documents.get(id);
    this.model.fetch({
      success: function() {
        that.init();
      }
    });
    
    $('#shelf').html('');
  },
  
  browseDocuments: function() {
    var that = this;
    // Load all documents available in the Repository
    // and render DocumentBrowser View
    Documents.fetch({
      success: function() {
        that.renderDocumentBrowser();
      },
      error: function() {
        alert('Error while fetching documents.');
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