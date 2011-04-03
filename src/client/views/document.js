function addEmptyDoc(type, name) {
  var docType = graph.get(type);
  var doc = graph.set(Data.uuid('/document/'+ app.username +'/'), docType.meta.template);
  doc.set({
    creator: "/user/"+app.username,
    created_at: new Date(),
    updated_at: new Date(),
    name: name
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
    'click a.unpublish-document': 'unpublishDocument',
    'click a.publish-document': 'publishDocument',
    
    // Actions
    'click a.add_child': 'addChild',
    'click a.add_sibling': 'addSibling',
    'click a.remove-node': 'removeNode'
  },
  
  loadedDocuments: {},
  
  initialize: function() {
    var that = this;
    this.attributes = new Attributes({el: '#attributes', model: this.model});
    
    this.app = this.options.app;
    this.mode = 'show';
    
    this.bind('status:changed', function() {
      that.updateCursors();
    });
    
    this.bind('changed', function() {
      document.title = that.model.get('title') || 'Untitled';
      // Re-render Document browser
      that.app.browser.render();
    });
  },
  
  updateCursors: function() {
    // $('.content-node.occupied').removeClass('occupied');
    // _.each(this.status.cursors, function(user, nodeKey) {
    //   var n = graph.get(nodeKey);
    //   $('#'+n.html_id).addClass('occupied');
    //   $('#'+n.html_id+' .cursor span').html(user);
    // });
  },
  
  render: function() {
    // Render all relevant sub views
    $(this.el).html(_.tpl('document_wrapper', {
      mode: this.mode,
      doc: this.model
    }));
    
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
    var level = parseInt($node.attr('level'));
    
    $('#'+node.html_id).replaceWith(new HTMLRenderer(node, parent, level).render());
    if (this.mode === 'edit') {
      renderControls(this.model, null, null, null, 0);
    } else {
      hijs('#'+node.html_id+' .content-node.code pre');
    }
  },
  
  renderDocument: function() {
    this.$('#document').html(new HTMLRenderer(this.model, null, 0).render());
    this.$('#attributes').show();
    this.$('#document').show();
    
    // Render controls
    if (this.mode === 'edit') {
      renderControls(this.model, null, null, null, 0);
    } else {
      hijs('.content-node.code pre');
    }
  },
  
  // renderVisualizations: function() {
  //   $('.visualization').each(function() {
  //     // Initialize visualization
  //     var c = new uv.Collection(countries_fixture);
  //     
  //     vis = new Linechart(c, {property: 'birth_rate', canvas: this});
  //     vis.start();
  //     
  //     // Stop propagation of mousewheel events
  //     $(this).bind('mousewheel', function() {
  //       return false;
  //     });
  //   });
  // },
  
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
      $('#document_tab').show();
      $('#document_tab').html(_.tpl('document_tab', {
        username: this.model.get('creator')._id.split('/')[2],
        document_name: this.model.get('name')
      }));
    }
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
    
    // Former DocumentView stuff
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
  
  newDocument: function(type, name) {
    this.model = addEmptyDoc(type, name);
    
    this.status = null;
    this.mode = 'edit';
    $(this.el).show();
    this.render();
    this.loadedDocuments[app.username+"/"+name] = this.model._id;
    this.init();
    
    // Update browser graph
    if (app.browser && app.browser.query && app.browser.query.type === "user" && app.browser.query.value === app.username) {
      app.browser.graph.set('objects', this.model._id, this.model);
    }
    
    // Move to the actual document
    app.toggleView('document');
    
    controller.saveLocation('#'+this.app.username+'/'+name);
    $('#document_wrapper').attr('url', '#'+this.app.username+'/'+name);
    
    this.trigger('changed');
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },
  
  loadDocument: function(username, docname, nodeid, mode) {
    var that = this;
    that.mode = mode || (username === this.app.username ? 'edit' : 'show');
    
    if (that.mode === 'edit' && !head.browser.webkit) {
      alert("You need to use a Webkit-based browser (Google Chrome, Safari) in order to write documents. In future, other browers will be supported too.");
      that.mode = 'show';
    }
    
    $('#tabs').show();
    function init(id) {
      that.model = graph.get(id);
      
      if (that.model) {
        that.render();
        that.init();
        that.reset();
        that.trigger('changed');
        that.loadedDocuments[username+"/"+docname] = id;
        
        // Update browser graph reference
        app.browser.graph.set('objects', id, that.model);
        app.toggleView('document');
        
        // TODO: register document for realtime sessions
        // remote.Session.registerDocument(id);
      } else {
        $('#document_wrapper').html('Document loading failed');
      }
    }
    
    var id = that.loadedDocuments[username+"/"+docname];
    $('#document_tab').show();
    
    
    // Already loaded - no need to fetch it
    if (id) {
      // TODO: check if there are changes from a realtime session
      init(id);
    } else {
      $('#document_tab').html('&nbsp;&nbsp;&nbsp;Loading...');
      $.ajax({
        type: "GET",
        url: "/documents/"+username+"/"+docname,
        dataType: "json",
        success: function(res) {
          if (res.status === 'error') {
            $('#document_wrapper').html('Document loading failed');
          } else {
            graph.merge(res.graph);
            init(res.id);
          }
        },
        error: function(err) {
          $('#document_wrapper').html('Document loading failed');
        }
      });
    }
  },
  
  closeDocument: function() {
    this.model = null;
    controller.saveLocation('#'+this.app.username);
    $('#document_wrapper').attr('url', '#'+this.app.username);
    $('#document_tab').hide();
    app.toggleView('content');
    this.render();
  },
  
  // Delete an existing document, given that the user is authorized
  // -------------
  
  deleteDocument: function(id) {
    var that = this;
    graph.del(id);
    app.browser.graph.del(id);
    app.browser.render();
    $('#document_tab').hide();
    setTimeout(function() {
      app.toggleView('browser');
    }, 300);
    notifier.notify(Notifications.DOCUMENT_DELETED);
  },
  
  // Reset to view mode (aka unselect everything)
  reset: function(noBlur) {
    if (!this.model) return;
    
    // if (!noBlur) $('.content').blur();
    $(document.activeElement).blur();
    
    this.app.document.selectedNode = null;
    this.resetSelection();

    // Broadcast
    // remote.Session.selectNode(null);
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
    } else if (this.selectedNode.type._id === '/type/resource') {
      this.nodeEditor = new ResourceEditor({el: $node});
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
    
    // Update modification date on original document
    this.model.set({
      updated_at: new Date()
    });
    
    // Only set dirty if explicitly requested    
    if (attrs.dirty) {
      this.trigger('change:node', this.selectedNode);
    }
    
    if (this.selectedNode.type.key === '/type/document') {
      this.trigger('changed');
    }
    
    // Notify all collaborators about the changed node
    if (this.status && this.status.collaborators.length > 1) {
      var serializedNode = this.selectedNode.toJSON();
      delete serializedNode.children;
      // remote.Session.registerNodeChange(this.selectedNode._id, serializedNode);
    }
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
    if (!e.stopProp && (!this.selectedNode || this.selectedNode.key !== key)) {
      var node = graph.get(key);
      this.selectedNode = node;
      this.trigger('select:node', this.selectedNode);
      e.stopProp = true;
      // The server will respond with a status package containing my own cursor position
      // remote.Session.selectNode(key);
    }
    e.stopPropagation();
    // return false;
  },
  
  publishDocument: function(e) {
    this.model.set({
      published_on: (new Date()).toJSON()
    });
    this.render();
    return false;
  },
  
  unpublishDocument: function() {
    this.model.set({
      published_on: null
    });
    this.render();
    return false;
  },
  
  addChild: function(e) {
    if (arguments.length === 1) {
      // Setup node
      var type = $(e.currentTarget).attr('type');
      var refNode = graph.get($(e.currentTarget).attr('node'));
      var newNode = graph.set(null, {"type": type, "document": this.model._id});
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
      // remote.Session.insertNode('child', newNode.toJSON(), $(e.currentTarget).attr('node'), null, 'after');
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
      var destination = $(e.currentTarget).attr('destination');
      
      // newNode gets populated with default values
      var newNode = graph.set(null, {"type": type, "document": this.model._id});
    } else {
      var refNode = graph.get(arguments[1]);
      var parentNode = graph.get(arguments[2]);
      var destination = arguments[3];
      var newNode = graph.set(arguments[0].nodeId, arguments[0]);
    }

    var targetIndex = parentNode.all('children').index(refNode._id);
    if (destination === 'after') targetIndex += 1;
    
    if (type === '/type/section') {
      // Move all successors inside the new section
      var successors = parentNode.get('children').rest(targetIndex);
      
      var predecessors = parentNode.get('children').select(function(c, key, index) {
        return index < targetIndex;
      });
      
      // Update parent node's children
      parentNode.set({children: predecessors.keys()});
      
      // Append successors to the new node
      newNode.set({
        children: successors.keys()
      });
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
      // remote.Session.insertNode('sibling', newNode.toJSON(), refNode._id, parentNode._id, destination);      
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
      // remote.Session.removeNode(node._id, parent._id);
    }
    return false;
  }
});