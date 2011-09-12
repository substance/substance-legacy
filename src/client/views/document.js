function addEmptyDoc(type, name, title) {
  var docType = graph.get(type);
  var doc = graph.set(Data.uuid('/document/'+ app.username +'/'), docType.meta.template);
  doc.set({
    creator: "/user/"+app.username,
    created_at: new Date(),
    updated_at: new Date(),
    name: name,
    title: title
  });
  return doc;
};

// The Document Editor View

var Document = Backbone.View.extend({
  events: {
    'mouseover .content-node': 'highlightNode',
    'mouseout .content-node': 'unhighlightNode',
    'click .content-node': 'selectNode',
    'click .toc-item': 'scrollTo',
    'click a.move-node': 'moveNode',
    'click a.toggle-move-node': 'toggleMoveNode',
    'click a.toggle-comments': 'toggleComments',
    'click a.create-comment': 'createComment',
    'click a.remove-comment': 'removeComment',
    'click a.subscribe-document': 'subscribeDocument',
    'click a.unsubscribe-document': 'unsubscribeDocument',
    'click a.export-document': 'toggleExport',
    'click a.toggle-settings': 'toggleSettings',
    'click a.toggle-publish-settings': 'togglePublishSettings',
    
    // Actions
    'click a.add_child': 'addChild',
    'click a.add_sibling': 'addSibling',
    'click a.remove-node': 'removeNode'
  },
  
  loadedDocuments: {},
  
  togglePublishSettings: function() {
    $('#document_settings').hide();
    $('.view-action-icon.settings').removeClass('active');
    
    $('#document_export').hide();
    $('.view-action-icon.export').removeClass('active');
    
    this.publishSettings.load();
    
    $('#publish_settings').slideToggle();
    $('.view-action-icon.publish-settings').toggleClass('active');
    return false;
  },
  
  toggleExport: function() {
    $('#document_settings').hide();
    $('.view-action-icon.settings').removeClass('active');
    
    $('#publish_settings').hide();
    $('.view-action-icon.publish-settings').removeClass('active');
    
    $('#document_export').slideToggle();
    $('.view-action-icon.export').toggleClass('active');
    return false;
  },
  
  toggleSettings: function() {
    $('#document_export').hide();
    $('.view-action-icon.export').removeClass('active');
    
    $('#publish_settings').hide();
    $('.view-action-icon.publish-settings').removeClass('active');
    
    this.settings.load();
    
    $('#document_settings').slideToggle();
    $('.view-action-icon.settings').toggleClass('active');
    return false;
  },
  
  removeComment: function(e) {
    var comment = graph.get($(e.currentTarget).attr('comment'));
    
    // All comments of the currently selected node
    var comments = this.selectedNode.get('comments');
    
    // Remove comment from node
    this.selectedNode.set({
      comments: comments.del(comment._id).keys()
    });
    
    // Remove comment
    graph.del(comment._id);
    // Re-render comments
    this.enableCommentEditor();
    return false;
  },
  
  toggleComments: function(e) {
    var nodeId = $(e.currentTarget).parent().parent().attr('name');
    var changed = false;
    if (!this.selectedNode || this.selectedNode._id !== nodeId) {
      // First select node
      this.selectedNode = graph.get(nodeId);
      this.trigger('select:node', this.selectedNode);
      changed = true;
    }
    this.enableCommentEditor();
    
    // Toggle them
    var wrapper = $('#'+this.selectedNode.html_id+' > .comments-wrapper');
    wrapper.toggleClass('expanded');
    if (changed) wrapper.addClass('expanded'); // overrule
    
    if (wrapper.hasClass('expanded')) {
      // Scroll to the comments wrapper
      var offset = wrapper.offset();
      $('html, body').animate({scrollTop: offset.top-100}, 'slow');
    }
    return false;
  },
  
  // Enable move mode
  toggleMoveNode: function() {
    var that = this;
    
    $('#document').addClass('move-mode');
    
    // Hide other move-node controls
    $('.move-node').hide();
    var $controls = $('.content-node .controls');
    
    // Show previously hidden labels
    $controls.find(".placeholder.move").show();
    
    $controls.each(function() {
      var $control = $(this);
      
      var node = that.selectedNode;
      var nodeType = that.selectedNode.type.key == "/type/section" ? "container-node" : "leaf-node";
      var count = 0;
      var depth = 0;

      function calcDepth(node) {
        if (!node.get('children')) return;
        var found = false;
        node.get('children').each(function(n) {
          if (n.type.key === "/type/section") {
            if (!found) depth += 1;
            found = true;
            calcDepth(n);
          }
        });
      }
      
      calcDepth(node);
      
      function checkDepth(level) {
        if (node.type.key !== "/type/section") return true;
        return level+depth <= 3;
      }
      
      // Detect cyclic references
      var cyclic = false;
      function isCyclic(n) {
        if (n===node) {
          cyclic = true;
        } else {
          var parent = that.getParent(n);
          if (parent) isCyclic(parent);
        }
        return cyclic;
      }

      $control.find('.move-node.'+nodeType).each(function() {
        var insertionType = $(this).hasClass('child') ? "child" : "sibling";
        var level = parseInt($(this).attr('level'));
        var ref = graph.get($(this).attr('node'));
        var parent = that.getParent(ref);
        
        // Skip if source node is referenced by the target node or one of its anchestors
        cyclic = false;
        if (isCyclic(ref)) return;
        
        // For sibling insertion mode
        if (insertionType === "sibling") {
          var allowedNodes = parent.properties().get('children').expectedTypes;
          if (_.include(allowedNodes, that.selectedNode.type.key)) {
            if (checkDepth(level)) {
              $(this).show();
              count++;            
            }
          }
        } else {
          $(this).show();
          count++;
        }
      });
      
      // Hide move label if there are no drop targets
      if (count === 0) {
        $control.find(".placeholder.move").hide();
      }
      
      // Hide move controls inside the selected node
      $('.content-node.selected .controls .move-node').hide();
      $controls = $('.content-node .controls');
    });
    return false;
  },
  
  // For a given node find the parent node
  getParent: function(node) {
    if (!node) return null;
    return graph.get($('#'+node._id.replace(/\//g, '_')).attr('parent'));
  },
  
  initialize: function() {
    var that = this;
    this.attributes = new Attributes({model: this.model});
    this.settings = new DocumentSettings();
    
    this.publishSettings = new PublishSettings();
    
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
  
  moveNode: function(e) {
    var node = this.selectedNode;
    var nodeParent = this.getParent(node);
    
    var ref = graph.get($(e.currentTarget).attr('node'));
    var refParent = this.getParent(ref);
    var destination = $(e.currentTarget).attr('destination');
    var insertionType = $(e.currentTarget).hasClass('child') ? "child" : "sibling";
    
    // Remove from prev. position
    nodeParent.all('children').del(node._id);
    nodeParent._dirty = true;
    
    this.trigger('change:node', nodeParent);
    
    if (insertionType === "child") {
      ref.all('children').set(node._id, node);
      ref._dirty = true;
      this.trigger('change:node', ref);
    } else {
      // Register at new position
      var targetIndex = refParent.all('children').index(ref._id);
      if (destination === 'after') targetIndex += 1;

      // Cleanup: Move all subsequent leaf nodes inside the new section
      if (node.type.key === '/type/section') {
        var successors = refParent.get('children').rest(targetIndex);
        var done = false;
        successors = successors.select(function(node) {
          if (!done && node.type.key !== "/type/section") {
            // Remove non-section successors from parent node
            refParent.all('children').del(node._id);
            return true;
          } else {
            done = true;
            return false;
          }
        });
        var children = new Data.Hash();
        var idx = 0;
        while (idx < node.get('children').length && node.get('children').at(idx).type.key !== "/type/section") {
          var n = node.get('children').at(idx);
          children.set(n._id, n);
          idx += 1;
        }
        children = children.union(successors);
        children = children.union(node.get('children').rest(idx));
        node.set({
          children: children.keys()
        });
      }
      // Connect to parent
      refParent.all('children').set(node._id, node, targetIndex);
      refParent._dirty = true;
      graph.trigger('dirty');
      this.trigger('change:node', refParent);
    }
    // Select node
    this.selectedNode = node;
    this.trigger('select:node', this.selectedNode);
    return false;
  },
  
  scrollTo: function(e) {
    var node = $(e.currentTarget).attr('node');
    app.scrollTo(node);
    router.navigate($(e.currentTarget).attr('href'));
    app.toggleTOC();
    return false;
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
    
    if (_.include(node.types().keys(), '/type/document')) {
      $('#document').html(new HTMLRenderer(node, parent, level).render());
    } else {
      $('#'+node.html_id).replaceWith(new HTMLRenderer(node, parent, level).render());
    }
    
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
      if (e.keyCode == 27) { that.reset(); } // ESC
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
  
  newDocument: function(type, name, title) {
    this.model = addEmptyDoc(type, name, title);
    
    this.status = null;
    this.mode = 'edit';
    $(this.el).show();
    this.render();
    this.loadedDocuments[app.username+"/"+name] = this.model._id;
    this.init();
    
    // Update browser graph
    if (app.browser && app.browser.query && app.browser.query.type === "user" && app.browser.query.value === app.username) {
      app.browser.graph.set('nodes', this.model._id, this.model);
    }
    
    // Move to the actual document
    app.toggleView('document');
    
    router.navigate(this.app.username+'/'+name);
    $('#document_wrapper').attr('url', '#'+this.app.username+'/'+name);
    
    this.trigger('changed');
    notifier.notify(Notifications.BLANK_DOCUMENT);
    return false;
  },
  
  loadDocument: function(username, docname, version, nodeid, commentid, mode) {
    var that = this;
    
    $('#tabs').show();
    function init(id) {
      that.model = graph.get(id);
      
      if (that.mode === 'edit' && !(head.browser.webkit || head.browser.mozilla)) {
        alert("Your browser is not yet supported. We recommend Google Chrome and Safari, but you can also use Firefox.");
        that.mode = 'show';
      }
      
      if (that.model) {
        that.render();
        that.init();
        that.reset();
        
        // window.positionBoard();
        that.trigger('changed');
        that.loadedDocuments[username+"/"+docname] = id;
        
        // Update browser graph reference
        app.browser.graph.set('nodes', id, that.model);
        app.toggleView('document');
        
        // Scroll to target node
        if (nodeid && !commentid) app.scrollTo(nodeid);
        
        // Scroll to comment
        if (nodeid && commentid) {
          var targetNode = graph.get(nodeid.replace(/_/g, '/'));
          
          that.selectedNode = targetNode;
          that.trigger('select:node', that.selectedNode);
          that.enableCommentEditor(targetNode);
          
          $('#'+nodeid+' > .comments-wrapper').show();
          app.scrollTo(commentid);
        }
      } else {
        $('#document_wrapper').html('Document loading failed');
      }
    }
    
    var id = that.loadedDocuments[username+"/"+docname];
    $('#document_tab').show();
    
    // Already loaded - no need to fetch it
    // if (id) {
    //   // TODO: check if there are changes from a realtime session
    //   init(id);
    // } else {
      
    function printError(error) {
      if (error === "not_authorized") {
        $('#document_tab').html('&nbsp;&nbsp;&nbsp; Not Authorized');
        $('#document_wrapper').html("<div class=\"notification error\">You are not authorized to access this document.</div>");
      } else {
        $('#document_tab').html('&nbsp;&nbsp;&nbsp; Document not found');
        $('#document_wrapper').html("<div class=\"notification error\">The requested document couldn't be found.</div>");
      }
      app.toggleView('document');
    }

    $('#document_tab').html('&nbsp;&nbsp;&nbsp;Loading...');
    $.ajax({
      type: "GET",
      url: version ? "/documents/"+username+"/"+docname+"/"+version : "/documents/"+username+"/"+docname,
      dataType: "json",
      success: function(res) {
        that.version = res.version;
        that.mode = mode || (res.authorized && !version ? "edit" : "show");
        if (res.status === 'error') {
          printError(res.error);
        } else {
          graph.merge(res.graph);
          init(res.id);
        }
      },
      error: function(err) {
        printError(JSON.parse(err.responseText).error);
      }
    });
    // }
  },
  
  subscribeDocument: function() {
    if (!app.username) {
      alert('Please log in to make a subscription.');
      return false;
    }
    
    graph.set(null, {
      type: "/type/subscription",
      user: "/user/"+app.username,
      document: this.model._id
    });
    
    this.model.set({
      subscribed: true,
      subscribers: this.model.get('subscribers') + 1
    });
    
    this.model._dirty = false; // Don't make dirty
    this.render();
    return false;
  },
  
  unsubscribeDocument: function() {
    var that = this;
    
    // Fetch the subscription object
    graph.fetch({type: "/type/subscription", "user": "/user/"+app.username, "document": this.model._id}, function(err, nodes) {
      if (nodes.length === 0) return;
      
      // Unsubscribe
      graph.del(nodes.first()._id);
      that.model.set({
        subscribed: false,
        subscribers: that.model.get('subscribers') - 1
      });
      that.model._dirty = false; // Don't make dirty
      that.render();
    });
    
    return false;
  },
  
  closeDocument: function() {
    this.model = null;
    router.navigate(this.app.username);
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
    if (!noBlur) $(document.activeElement).blur();
    
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
    
    // Rest move-node mode, if active
    $('.move-node').hide();
    $('#document').removeClass('move-mode');
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
    if (attrs._dirty) {
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
  
  createComment: function(e) {
    var comments = this.selectedNode.get('comments') ? this.selectedNode.get('comments').keys() : [];
    
    var comment = graph.set(null, {
      type: "/type/comment",
      node: this.selectedNode._id,
      document: this.model._id,
      created_at: new Date(),
      creator: '/user/'+app.username,
      content: this.commentEditor.content()
    });
    
    comments.push(comment._id);
    this.selectedNode.set({
      comments: comments
    });

    this.enableCommentEditor();
    return false;
  },
  
  enableCommentEditor: function(node) {
    
    node = node ? node : this.selectedNode;
    var that = this;
    
    // Render comments
    var wrapper = $('#'+node.html_id+' > .comments-wrapper');
    if (wrapper.length === 0) return;
    
    wrapper.html(_.tpl('comments', {node: node}));
    
    var comments = node.get('comments');
    var count = comments && comments.length > 0 ? comments.length : "";
    
    // Update comment count
    $('#'+node.html_id+' > .operations a.toggle-comments span').html(count);
    
    var $content = $('#'+node.html_id+' > .comments-wrapper .comment-content');
    function activate() {
      that.commentEditor = new Proper();
      that.commentEditor.activate($content, {
        multiline: true,
        markup: true,
        placeholder: 'Enter Comment'
      });
      return false;
    }
    
    $content.unbind();
    $content.click(activate);
  },
  
  selectNode: function(e) {
    var that = this;
    // if (this.mode === 'show') return; // Skip for show mode
    
    var key = $(e.currentTarget).attr('name');
    if (!e.stopProp && (!this.selectedNode || this.selectedNode.key !== key)) {
      var node = graph.get(key);
      this.selectedNode = node;
      this.trigger('select:node', this.selectedNode);
      e.stopProp = true;
      // The server will respond with a status package containing my own cursor position
      // remote.Session.selectNode(key);
      
      var wrapper = $('#'+this.selectedNode.html_id+' > .comments-wrapper');
      wrapper.removeClass('expanded');
      // this.enableCommentEditor();
    }
    e.stopPropagation();
    // return false;
  },
  
  // Update the document's name
  updateName: function(name) {
    this.model.set({
      name: name
    });
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
    refNode._dirty = true;
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
      
      var done = false;
      successors = successors.select(function(node) {
        if (!done && node.type.key !== "/type/section") {
          // Remove non-section successors from parent node
          parentNode.all('children').del(node._id);
          return true;
        } else {
          done = true;
          return false;
        }
      });
      
      // Append successors to the new node
      newNode.set({
        children: successors.keys()
      });
    }
    
    // Connect to parent
    parentNode.all('children').set(newNode._id, newNode, targetIndex);
    parentNode._dirty = true;
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
    parent._dirty = true;
    this.trigger('change:node', parent);

    if (arguments.length === 1) {
      // Broadcast insert node command
      // remote.Session.removeNode(node._id, parent._id);
    }
    this.reset();
    return false;
  }
});