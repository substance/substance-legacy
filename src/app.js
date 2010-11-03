// DocumentComposer - Data-driven content authoring
(function() {
  
  // Helpers
  // ---------------
  
  var Helpers = {};

  // Templates for the moment are recompiled every time
  Helpers.renderTemplate = function(tpl, view, helpers) {
    source = $("script[name="+tpl+"]").html();
    var template = Handlebars.compile(source);
    return template(view, helpers || {});
  };
  
  // Document - acts as a proxy to the underlying ContentGraph
  // ---------------
  
  var Document = Backbone.Model.extend({
    
    initialize: function(spec) {
      // Initialize content graph
      console.log('document contructor called...');
      
      // Initialize ContentGraph if present
      if (this.get('contents')) {
        this.g = new ContentGraph(this.get('contents'));
      }
      
      this.selectedNode = null;
    },
    
    parse: function(res) {
      if (res.contents) {
        this.g = new ContentGraph(res.contents);
      }
      return res;
    },
    
    toJSON: function() {
      var that = this;
      
      var result = _.extend(_.clone(this.attributes), {
        contents: this.g.serialize()
      });
      
      console.log(result);
      
      return result;
    },
    
    createEmptyNode: function(type) {
      var key = this.g.generateId(); // Get a new unique NodeId

      // Create a node with default properties according
      // to the node type
      var data = {children: [], type: type};

      // Set default values
      ContentNode.types[type].properties.forEach(function(p) {
        data[p.key] = p.defaultValue;
      });

      return new ContentNode(this.g, key, data);
    },
    
    // Create a node of a given type
    createSibling: function(type) {
      var newNode = this.createEmptyNode(type),
          predecessor = this.selectedNode;
          
      newNode.build();
      newNode.parent = predecessor.parent;

      // Attach to ContentGraph
      predecessor.parent.addChild(newNode, predecessor);
      
      this.trigger('change:node', predecessor.parent);
      this.selectNode(newNode.key);
    },

    // Create a child node of a given type
    createChild: function(type) {
      var parent = this.selectedNode,
          newNode = this.createEmptyNode(type);
          
      newNode.build();
      newNode.parent = parent;

      // Attach to ContentGraph
      parent.addChild(newNode);
      
      this.trigger('change:node', parent);
      this.selectNode(newNode.key);
    },

    // Remove a node from the document
    removeNode: function() {
      var node = this.selectedNode;
      node.parent.removeChild(node.key);
      
      this.trigger('change:node', node.parent);
    },
    
    // Update attributes of selected node
    updateSelectedNode: function(attrs) {
      _.extend(this.selectedNode.data, attrs);
      
      this.trigger('change:node', this.selectedNode);
    },
    
    selectNode: function(key) {
      if (key === "root") {
        this.selectedNode = this.g;
      } else {
        this.selectedNode = this.g.get('nodes', key);
      }
      this.trigger('select:node', this.selectedNode);
    }
  });
  
  // Acts as a stub for new documents
  Document.EMPTY = {
    "title": "Untitled",
    "author": "John Doe",
    "children": ["1", "2"],
    "nodeCount": 4,
    "nodes": {
      "1": {
        "type": "section",
        "name": "First Chapter",
        "children": ["3"]
      },
      "2": {
        "type": "section",
        "name": "Second Chapter",
        "children": ["4"]
      },
      "3": {
        "type": "paragraph",
        "content": "Your text goes here."
      },
      "4": {
        "type": "image",
        "url": "http://tmp.vivian.transloadit.com/scratch/9a65045a69dd88c2baf281c28dbd15a7"
      }
    }
  };
  
  
  // Todo Collection
  // ---------------

  // The collection of todos is backed by *localStorage* instead of a remote
  // server.
  var DocumentList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Document,
    
    url: '/documents',
    
    initialize: function() {
      
    },

    // We keep the Documents in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Todos are sorted by their original insertion order.
    comparator: function(todo) {
      return todo.get('order');
    }
  });
  
  var Documents = new DocumentList();
  

  // NodeEditors
  // ---------------

  var DocumentEditor = Backbone.View.extend({
    events: {
      'keydown .property': 'updateNode'
    },
    
    initialize: function() {
      this.render();
    },
    
    updateNode: function() {
      var that = this;
      
      setTimeout(function() {
        console.log($('#editor input[name=title]').val());
        that.model.updateSelectedNode({
          title: $('#editor input[name=title]').val()
        });
      }, 5);
    },
    
    render: function() {
      $(this.el).html(Helpers.renderTemplate('edit_document', this.model.selectedNode.data));
    }
  });

  var ParagraphEditor = Backbone.View.extend({
    events: {
      'keydown .property': 'updateNode'
    },
    
    initialize: function() {
      this.render();
    },
    
    updateNode: function() {
      var that = this;
      
      setTimeout(function() {
        that.model.updateSelectedNode({
          content: $('#editor textarea[name=content]').val()
        });
      }, 5);
    },
    
    render: function() {
      $(this.el).html(Helpers.renderTemplate('edit_paragraph', this.model.selectedNode.data));
    }
  });
  
  
  var SectionEditor = Backbone.View.extend({
    events: {
      'keydown .property': 'updateNode'
    },
    
    initialize: function() {
      this.render();
    },
    
    updateNode: function(e) {
      var that = this;
      
      setTimeout(function() {
        that.model.updateSelectedNode({
          name: $('#editor input[name=name]').val()
        });
      }, 5);
    },
    
    render: function() {
      $(this.el).html(Helpers.renderTemplate('edit_section', this.model.selectedNode.data));
    }
  });

  
  var ImageEditor = Backbone.View.extend({
    events: {
      
    },
    
    initialize: function() {
      var that = this;
      this.render();
      
      $('#MyForm').transloadit({
        modal: false,
        wait: true,
        autoSubmit: false,
        onProgress: function(bytesReceived, bytesExpected) {
          percentage = (bytesReceived / bytesExpected * 100).toFixed(2)
          $('#upload_progress').attr('style', 'width:' + percentage +'%');
          $('#image_progress_legend').html('<strong>Uploading:</strong> ' + percentage + '% complete</div>');
        },
        onError: function(assembly) {
          alert(assembly.error+': '+assembly.message);
        },
        onStart: function() {
          $('#progress_container').show();
        },
        onSuccess: function(assembly) {
          try {
            // This triggers a node re-render
            that.model.updateSelectedNode({
              url: assembly.results.resize_image[0].url
            });
            $('#progress_container').hide();
          } catch (err) {
            console.log(assembly);
            console.log(err);
            alert('Strange upload error. See console.');
          }
        }
      });
    },
    
    render: function() {
      $(this.el).html(Helpers.renderTemplate('edit_image', this.model.selectedNode.data));
    }
  });
  
  
  // NodeActions Panel
  // ---------------
  
  var NodeActions = Backbone.View.extend({
    events: {
      'click a.add_child': 'addChild',
      'click a.add_sibling': 'addSibling',
      'click a.remove_node': 'removeNode'
    },
    
    initialize: function() {
      // Init somehow
      var that = this;
      
      // this.el.hide();
      
      // Re-render on select:node
      this.model.bind('select:node', function(node) {
        that.render();
      });
    },
    
    // Show action panel
    show: function() {
      
    },
    
    // Hide action panel
    hide: function() {
      
    },
    
    addChild: function(e) {
      this.model.createChild($(e.currentTarget).attr('type'));
      return false;
    },
    
    addSibling: function(e) {
      this.model.createSibling($(e.currentTarget).attr('type'));
      return false;
    },
    
    removeNode: function(e) {
      this.model.removeNode();
      return false;
    },
    
    render: function() {
      var $node = $('#'+this.model.selectedNode.key);
      
      $('#actions').css('left', $node.offset().left).css('top', $node.offset().top+$node.height());
      
      if (this.model.selectedNode) {
        $(this.el).html(Helpers.renderTemplate('actions', {
          children: ContentNode.types[this.model.selectedNode.type].allowedChildren,
          siblings: this.model.selectedNode.parent ? ContentNode.types[this.model.selectedNode.parent.type].allowedChildren : []
        }));
      }
    }
  });
  
  // DocumentView
  // ---------------
  
  var DocumentView = Backbone.View.extend({
    events: {
      'mouseover .content-node': 'highlightNode',
      'mouseout .content-node': 'unhighlightNode',
      'click .content-node': 'selectNode'
    },
    
    initialize: function() {
      var that = this;
      
      // Bind Events
      this.model.bind('change:node', function(node) {
        that.renderNode(node);
      });
    },
    
    renderNode: function(node) {
      $('#'+node.key).replaceWith(new HTMLRenderer(node).render());
    },
    
    render: function() {
      $(this.el).html(new HTMLRenderer(this.model.g).render());
    },
    
    highlightNode: function(e) {
      $(e.currentTarget).addClass('active');
      return false;
    },
    
    unhighlightNode: function(e) {
      $(e.currentTarget).removeClass('active');
      return false;
    },
    
    selectNode: function(e) {
      if (this.model.selectedNode) {
        this.$('#' + this.model.selectedNode.key).removeClass('selected');
      }
      this.model.selectNode($(e.currentTarget).attr('id'));
      $(e.currentTarget).addClass('selected');
      return false;
    }
  });
  
  
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
      this.model.save({}, {
        success: function() {
          alert('A document has been created successfully.')
        }
      });
      
      this.init();
      return false;
    },
    
    saveDocument: function() {
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
      
      this.model = Documents.get(id)
      this.model.fetch({
        success: function() {
          that.init();
        }
      });
      
      $('#dialog').html('');
      
    },
    
    browseDocuments: function() {
      var that = this;
      // Load all documents available in the Repository
      // and render DocumentBrowser View
      Documents.fetch({
        success: function() {
          that.renderDocumentBrowser();
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
      this.documentBrowser = new DocumentBrowser({el: this.$('#dialog'), model: this.model, composer: this});
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
      
      // Init Actions panel
      this.actions = new NodeActions({el: $('#actions'), model: this.model});
    }
  });
  
  // DocumentBrowser widget / used to select a document to load
  var DocumentBrowser = Backbone.View.extend({
    events: {
      'click a.load_document': 'loadDocument'
    },
    
    initialize: function() {
      
    },
    
    loadDocument: function(e) {
      // Trigger a document load
      this.options.composer.loadDocument($(e.currentTarget).attr('key'));
      return false;
    },
    
    render: function() {
      $(this.el).html(Helpers.renderTemplate('browse_documents', {
        documents: Documents.models.map(function(d) { return d.attributes })
      }));
    }
  });
  
  
  $(function() {

    // Load a document
    // var doc = new ContentGraph(Document.EMPTY_DOC);
    
    // Start the engines
    var app = new DocumentComposer({el: $('#container')});
    
    // Initial rendering
    app.render();
    
    // Load initial doc
    // Documents.fetch({
    //   success: function() {
    //     app.loadDocument('075059412b9d2d61362b5014bb003618');
    //   }
    // });
        
  });
  
})();
