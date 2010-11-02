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
    
    initialize: function(g) {
      // Initialize content graph
      this.g = g;
      this.selectedNode = g.get('nodes', 'image1');
    },
    
    save: function() {
      console.log('not yet implemented...');
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
        that.model.updateSelectedNode({
          content: $('#editor input[name=title]').val()
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
      this.$('#' + this.model.selectedNode.key).removeClass('selected');
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
      
    },

    initialize: function() {
      _.bindAll(this, "render");
    },

    // Should be rendered just once
    render: function() {
      $(this.el).html(Helpers.renderTemplate('editor')); 
      return this;
    },
    
    // Load document
    load: function(doc) {
      var that = this;
      this.model = new Document(doc);
      
      // Inject node editor on every select:node
      this.model.unbind('select:node');
      this.model.bind('select:node', function(node) {
        that.renderNodeEditor();
      });
      
      this.renderNodeEditor();
      this.renderDocumentView();
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
      this.actions.render();
    }
  });

  
  $(function() {

    // Load a document
    var doc = new ContentGraph(article_fixture);
    
    // Start the engines
    var app = new DocumentComposer({el: $('#container')});
    
    // Initial rendering
    app.render();
    app.load(doc);
  });
  
})();
