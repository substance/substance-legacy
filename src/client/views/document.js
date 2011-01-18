function addEmptyDoc(type) {
  var docType = graph.get(type);
  var doc = graph.set(Data.uuid('/document/'+ app.username +'/'), docType.meta.template);
  doc.set({
    creator: "/user/"+app.username,
  });
  
  return doc;
};

// The Document Editor View

var Document = Backbone.View.extend({
  events: {
    'mouseover .content-node': 'highlightNode',
    'mouseout .content-node': 'unhighlightNode',
    'click .content-node': 'selectNode',
    'click .controls .handle': 'showActions',
    
    // Actions
    'click a.add_child': 'addChild',
    'click a.add_sibling': 'addSibling',
    'click a.remove-node': 'removeNode',
    'dragstart': 'dragStart',
    'dragend': 'dragEnd',
    'dragenter': 'dragEnter',
    'dragover': 'dragOver',
    'dragleave': 'dragLeave',
    'drop': 'drop'
  },
  
  initialize: function() {
    var that = this;
    
    this.attributes = new Attributes({el: '#attributes', model: this.model});
    
    this.mode = 'show';
    this.bind('status:changed', function() {
      that.updateCursors();
    });
    
    // this.bind('document:changed', function() {
    //   document.title = that.model.get('title');
    //   
    //   // app.toggleView('editor'); // TODO: ugly
    //   // that.drawer.renderContent(); // Refresh attributes et. al
    //   // that.drawer.render();
    // });
  },
  
  updateCursors: function() {
    $('.content-node.occupied').removeClass('occupied');
    _.each(this.status.cursors, function(user, nodeKey) {
      var n = graph.get(nodeKey);
      $('#'+n.html_id).addClass('occupied');
      $('#'+n.html_id+' .cursor span').html(user);
    });
  },
  
  render: function() {
    // Render all relevant sub views
    $(this.el).html(Helpers.renderTemplate('document_wrapper'));
    this.renderMenu();

    if (this.model) {
      // Render Attributes
      this.attributes.render();
      
      // Render the acutal document
      this.renderDocument();
    }
  },
  
  // Re-renders a particular node and all child nodes
  renderNode: function(node) {
    var $node = $('#'+node.html_id);
    var parent = graph.get($node.attr('parent'));
    
    $('#'+node.html_id).replaceWith(new HTMLRenderer(node, parent).render());
    
    // Render controls
     if (this.mode === 'edit') renderControls(app.document.model);
     this.renderVisualizations();
  },
  
  renderDocument: function() {
    this.$('#document').html(new HTMLRenderer(this.model).render());
    this.$('#attributes').show();
    this.$('#document').show();
    
    // Render controls
    if (this.mode === 'edit') renderControls(this.model);
    this.renderVisualizations();
  },
  
  renderVisualizations: function() {
    $('.visualization').each(function() {
      // Initialize visualization
      var c = new uv.Collection(countries_fixture);
      
      vis = new Linechart(c, {property: 'birth_rate', canvas: this});
      vis.start();
      
      // Stop propagation of mousewheel events
      $(this).bind('mousewheel', function() {
        return false;
      });
    });
  },
  
  // Extract available documentTypes from config
  documentTypes: function() {
    var result = [];
    graph.get('/config/substance').get('document_types').each(function(type, key) {
      result.push({
        type: key,
        name: graph.get(key).name
      });
    });
    return result;
  },
  
  renderMenu: function() {
    if (this.model) {
      this.$('#document_menu').html(_.renderTemplate('document_menu', {
        edit: this.mode === 'edit',
        username: this.model.get('creator')._id.split('/')[2],
        document_name: this.model.get('name'),
        document: this.model.toJSON()
      }));
    } else {
      if (app.username) {
        this.$('#document_menu').html(_.renderTemplate('document_menu_create', {
          document_types: this.documentTypes()
        }));
      } else {
        this.$('#document_menu').hide();
      }
    }
    window.positionDocumentMenu();
  },
  
  init: function() {
    var that = this;
    
    // Inject node editor on every select:node
    this.unbind('select:node');
    
    this.bind('select:node', function(node) {
      that.resetSelection();
      $('#'+node.html_id).addClass('selected');
      
      $('#document').addClass('edit-mode');
      // Deactivate Richtext Editor
      editor.deactivate();
      
      // Render inline Node editor
      that.renderNodeEditor(node);
    });
    
    
    // Former DocumentView
    
    this.bind('change:node', function(node) {
      that.renderNode(node);
    });
    
    // Points to the selected
    that.selectedNode = null;

    // TODO: Select the document node on-init
    $(document).unbind('keyup');
    $(document).keyup(function(e) {
      if (e.keyCode == 27) { that.reset(); }  // esc
      e.stopPropagation();
    });
    
    
    // New node
    $(document).bind('keydown', 'alt+down', function(e) {
      console.log('alt+right pressed');
      
      if (that.selectedNode) {
        var controls = $('.controls[node='+that.selectedNode._id+'][destination=after]');
        if (controls) {
          controls.addClass('active');
          // Enable insert mode
          $('#document').addClass('insert-mode');
        }
      }
    });
    
    $(document).bind('keydown', 'right', function(e) {
      // TODO: implement cycle through node insertion buttons
    });
    
    $(document).bind('keydown', 'left', function(e) {
      // TODO: implement cycle through node insertion buttons
    });
  },
  
  newDocument: function(type) {
    this.model = addEmptyDoc(type);
    this.status = null;
    this.mode = 'edit';
    $(this.el).show();
    this.render();
    this.init();
    
    // Move to the actual document
    app.scrollTo('#document_wrapper');
    
    this.trigger('document:changed');
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },
  
  
  loadDocument: function(username, docname) {
    var that = this;
    notifier.notify(Notifications.DOCUMENT_LOADING);
    
    remote.Session.getDocument(username, docname, function(err, id, g) {
      if (!err) {
        graph.merge(g, true);
        that.model = graph.get(id);
        
        if (that.model) {
          that.mode = username === app.username ? 'edit' : 'show';
          
          that.render();
          that.init();
          that.trigger('document:changed');

          // Move to the actual document
          app.scrollTo('#document_wrapper');

          notifier.notify(Notifications.DOCUMENT_LOADED);
          remote.Session.registerDocument(id);
        } else {
          notifier.notify(Notifications.DOCUMENT_LOADING_FAILED);
        }
      } else {
        notifier.notify(Notifications.DOCUMENT_LOADING_FAILED);
      }
    });
  },
  
  // Store a document
  // -------------
  
  saveDocument: function() {
    var that = this;
    
    notifier.notify(Notifications.DOCUMENT_SAVING);
    
    graph.save(function(err, invalidNodes) {
      if (err) return notifier.notify(Notifications.DOCUMENT_SAVING_FAILED);
      notifier.notify(Notifications.DOCUMENT_SAVED);
      controller.saveLocation('#'+that.model.get('creator')._id.split('/')[2]+'/'+that.model.get('name'));
      
      // Reload document browser
      app.browser.render();
    });
  },
  
  closeDocument: function() {
    this.model = null;
    this.render();
  },
  
  // Delete an existing document, given that the user is authorized
  // -------------
  
  deleteDocument: function(id) {
    var that = this;
    
    graph.del(id);
    
    notifier.notify(Notifications.DOCUMENT_DELETING);
    graph.save(function(err) {
      if (err) {
        notifier.notify(Notifications.DOCUMENT_DELETING_FAILED);
      } else {
        app.browser.render();
        notifier.notify(Notifications.DOCUMENT_DELETED);
      }
    });
  },
  
  
  // Reset to view mode (aka unselect everything)
  reset: function(noBlur) {
    if (!app.document.model) return;
    if (!noBlur) $('.content').blur();
    
    app.document.model.selectedNode = null;
    this.resetSelection()

    // Broadcast
    remote.Session.selectNode(null);
    return false;
  },
  
  resetSelection: function() {
    this.$('.content-node.selected').removeClass('selected');
    $('#document .controls.active').removeClass('active');
    
    $('#document').removeClass('edit-mode');
    $('#document').removeClass('insert-mode');
    $('.proper-commands').hide();
    
    // Reset node-editor-placeholders
    $('.node-editor-placeholder').html('');
  },
  
  renderNodeEditor: function(node) {
    var $node = $('#'+node.html_id);
    
    if (this.mode !== 'edit') return;
    
    // Depending on the selected node's type, render the right editor
    if (_.include(this.selectedNode.types().keys(), '/type/document')) {
      this.nodeEditor = new DocumentEditor({el: $('#drawer_content')});
    } else if (this.selectedNode.type._id === '/type/text') {
      this.nodeEditor = new TextEditor({el: $node});
    } else if (this.selectedNode.type._id === '/type/section') {
      this.nodeEditor = new SectionEditor({el: $node});
    } else if (this.selectedNode.type._id === '/type/image') {
      this.nodeEditor = new ImageEditor({el: $node});
    } else if (this.selectedNode.type._id === '/type/quote') {
      this.nodeEditor = new QuoteEditor({el: $node});
    } else if (this.selectedNode.type._id === '/type/code') {
      this.nodeEditor = new CodeEditor({el: $node});
    } else if (this.selectedNode.type._id === '/type/question') {
      this.nodeEditor = new QuestionEditor({el: $node});
    } else if (this.selectedNode.type._id === '/type/answer') {
      this.nodeEditor = new AnswerEditor({el: $node});
    }
  },
  
  updateNode: function(nodeKey, attrs) {
    var node = graph.get(nodeKey);
    node.set(attrs);
    this.trigger('change:node', node);
  },
  
  // Update attributes of selected node
  updateSelectedNode: function(attrs) {
    if (!this.selectedNode) return;
    this.selectedNode.set(attrs);
    
    // Only set dirty if explicitly requested    
    if (attrs.dirty) {
      this.trigger('change:node', this.selectedNode);
    }
    
    if (this.selectedNode.type.key === '/type/document') {
      this.trigger('document:changed');
    }
    
    // Notify all collaborators about the changed node
    if (app.document.status && app.document.status.collaborators.length > 1) {
      var serializedNode = this.selectedNode.toJSON();
      delete serializedNode.children;
      remote.Session.registerNodeChange(this.selectedNode._id, serializedNode);
    }
  },
  
  showActions: function(e) {
    this.reset();
    $(e.target).parent().parent().addClass('active');
    
    // Enable insert mode
    $('#document').addClass('insert-mode');
    return false;
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
    if (this.mode === 'show') return; // Skip for show mode
    
    var key = $(e.currentTarget).attr('name');
    
    if (!this.selectedNode || this.selectedNode.key !== key) {
      var node = graph.get(key);
      if (this.selectedNode !== node) { // only if changed
        this.selectedNode = node;
        this.trigger('select:node', this.selectedNode);

        // The server will respond with a status package containing my own cursor position
        remote.Session.selectNode(key);
      }
    }
    
    e.stopPropagation();
  },
  
  addChild: function(e) {
    if (arguments.length === 1) {
      // Setup node
      var type = $(e.currentTarget).attr('type');
      var refNode = graph.get($(e.currentTarget).attr('node'));
      var newNode = graph.set(null, {type: type});
    } else {
      var refNode = graph.get(arguments[1]);
      var newNode = graph.set(arguments[0].nodeId, arguments[0]);
    }
    
    // Connect child node
    refNode.all('children').set(newNode._id, newNode);
    refNode.dirty = true;
    this.trigger('change:node', refNode);
    
    // Select newly created node
    this.selectedNode = newNode;
    this.trigger('select:node', this.selectedNode);
    
    
    if (arguments.length === 1) {
      // Broadcast insert node command
      remote.Session.insertNode('child', newNode.toJSON(), $(e.currentTarget).attr('node'), null, 'after');
    }
    return false;
  },
  
  // TODO: cleanup!
  addSibling: function(e) {
    if (arguments.length === 1) {
      // Setup node
      var type = $(e.currentTarget).attr('type');
      var refNode = graph.get($(e.currentTarget).attr('node'));
      var parentNode = graph.get($(e.currentTarget).attr('parent'));
      var destination = $(e.currentTarget).parent().parent().attr('destination');
      
      // newNode gets populated with default values
      var newNode = graph.set(null, {type: type});
    } else {
      var refNode = graph.get(arguments[1]);
      var parentNode = graph.get(arguments[2]);
      var destination = arguments[3];
      var newNode = graph.set(arguments[0].nodeId, arguments[0]);
    }

    var targetIndex = parentNode.all('children').index(refNode._id);
    
    if (destination === 'after') {
      targetIndex += 1;
    }
    
    // Connect to parent
    parentNode.all('children').set(newNode._id, newNode, targetIndex);
    parentNode.dirty = true;
    this.trigger('change:node', parentNode);

    // Select newly created node
    this.selectedNode = newNode;
    this.trigger('select:node', this.selectedNode);
    
    if (arguments.length === 1) {
      // Broadcast insert node command
      remote.Session.insertNode('sibling', newNode.toJSON(), refNode._id, parentNode._id, destination);      
    }
    return false;
  },
    
  removeNode: function(e) {
    if (arguments.length === 1) {
      var node = graph.get($(e.currentTarget).attr('node'));
      var parent = graph.get($(e.currentTarget).attr('parent'));
    } else {
      var node = graph.get(arguments[0]);
      var parent = graph.get(arguments[1]);
    }
    
    parent.all('children').del(node._id);
    graph.del(node._id);
    parent.dirty = true;
    this.trigger('change:node', parent);

    if (arguments.length === 1) {
      // Broadcast insert node command
      remote.Session.removeNode(node._id, parent._id);
    }
    
    return false;
  }
});