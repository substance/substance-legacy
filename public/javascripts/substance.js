// Register Notifications
var Notifications = {
  CONNECTED: {
    message: 'Just established a server connection.',
    type: 'info'
  },
  
  AUTHENTICATED: {
    message: 'Successfully authenticated.',
    type: 'success'
  },
  
  AUTHENTICATION_FAILED: {
    message: 'Authentication failed.',
    type: 'error'
  },
  
  SIGNUP_FAILED: {
    message: 'User Registration failed. Check your input',
    type: 'error'
  },
  
  DOCUMENT_LOADING: {
    message: 'Loading document ...',
    type: 'info'
  },
  
  DOCUMENT_LOADED: {
    message: 'Document successfully loaded.',
    type: 'success'
  },
  
  DOCUMENT_LOADING_FAILED: {
    message: 'An error ocurred during loading.',
    type: 'error'    
  },
  
  DOCUMENTS_LOADING: {
    message: 'Loading available documents ...',
    type: 'info'
  },
  
  DOCUMENTS_LOADED: {
    message: 'Documents fetched.',
    type: 'success'
  },
  
  DOCUMENTS_LOADING_FAILED: {
    message: 'An error occured during loading documents',
    type: 'error'
  }, 
  
  BLANK_DOCUMENT: {
    message: "You are now editing a blank document.",
    type: 'info'
  },
  
  DOCUMENT_SAVING: {
    message: "Saving document ...",
    type: 'info'
  },
  
  DOCUMENT_SAVED: {
    message: "The document has been stored in the repository.",
    type: 'success'
  },
  
  DOCUMENT_SAVING_FAILED: {
    message: "Error during saving.",
    type: 'error'
  },
  
  SYNCHRONIZING: {
    message: "Synchronizing with server ...",
    type: 'info'
  },
  
  SYNCHRONIZED: {
    message: "Successfully synchronized with server",
    type: 'info'
  },
  
  SYNCHRONIZING_FAILED: {
    message: "Failed to synchronize with server",
    type: 'error'
  },
  
  DOCUMENT_INVALID: {
    message: "The document is invalid. Make sure that you've set a correct name for it.",
    type: 'error'
  },
  
  DOCUMENT_ALREADY_EXISTS: {
    message: "This document name is already taken.",
    type: 'error'
  },
  
  DOCUMENT_DELETING: {
    message: "Deleting document ...",
    type: 'info'
  },
  
  DOCUMENT_DELETED: {
    message: "The document has been deleted.",
    type: 'success'
  },
  
  DOCUMENT_DELETING_FAILED: {
    message: "Error during deletion.",
    type: 'error'
  },
  
  NEW_COLLABORATOR: {
    message: "A new collaborator just went online.",
    type: 'info'
  },
  
  EXIT_COLLABORATOR: {
    message: "One collaborator just left.",
    type: 'info'
  }
};


Backbone.Notifier = function(options) {
  options || (options = {});
  if (this.initialize) this.initialize(options);
};

_.extend(Backbone.Notifier.prototype, Backbone.Events, {
  notify: function(message) {
    this.trigger('message:arrived', message);
  }
});


// Set up global notification system
var notifier = new Backbone.Notifier();

// Listen for messages 
notifier.bind('message:arrived', function(message) {
  var $message = $('<p class="notification"><span>'+message.type+':</span>'+message.message+'</p>');
  $('#notifications .wrapper').append($message);
  
  if (message.message.indexOf('...') !== -1) {
    $message.addClass('activity');
    
  } else {
    $('#notifications .wrapper p.activity').remove();
    // Just flash message if it's not a wait... message
    setTimeout(function() {
      $message.remove();
    }, 4000);
  }
});
// Helpers
// ---------------

/**
 * Date.parse with progressive enhancement for ISO-8601, version 2
 * © 2010 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */
(function () {
    _.date = function (date) {
        var timestamp = Date.parse(date), minutesOffset = 0, struct;
        if (isNaN(timestamp) && (struct = /^(\d{4}|[+\-]\d{6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?))?/.exec(date))) {
            if (struct[8] !== 'Z') {
                minutesOffset = +struct[10] * 60 + (+struct[11]);

                if (struct[9] === '+') {
                    minutesOffset = 0 - minutesOffset;
                }
            }

            timestamp = Date.UTC(+struct[1], +struct[2] - 1, +struct[3], +struct[4], +struct[5] + minutesOffset, +struct[6], +struct[7].substr(0, 3));
        }

        return new Date(timestamp).toDateString();
    };
}());


// A fake console to calm down some browsers.
if (!window.console) {
  window.console = {
    log: function(msg) {
      // No-op
    }
  }
}

var Helpers = {};

// Templates for the moment are recompiled every time
Helpers.renderTemplate = _.renderTemplate = function(tpl, view, helpers) {
  source = $("script[name="+tpl+"]").html();
  var template = Handlebars.compile(source);
  return template(view, helpers || {});
};


_.slug = function(str) {
  str = str.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();
  
  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to   = "aaaaeeeeiiiioooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

  return str;
}

_.scrollTop = function() {
  return document.body.scrollTop || document.documentElement.scrollTop;
}

// Render Underscore templates
_.tpl = function(tpl, ctx) {
  source = $("script[name="+tpl+"]").html();
  return _.template(source, ctx);
};


_.fullSelection = function(contentEditableElement)
{
  var range,selection;
  if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
  {
      range = document.createRange();//Create a range (a range is a like the selection but invisible)
      range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
      //range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
      selection = window.getSelection();//get the selection object (allows you to change selection)
      selection.removeAllRanges();//remove any selections already made
      selection.addRange(range);//make the range you have just created the visible selection
  }
  else if(document.selection)//IE 8 and lower
  {
      range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
      range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
      range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
      range.select();//Select the range (make it the visible selection
  }
}

_.prettyDate = function(time) {
  return jQuery.timeago(time);
};


_.stripTags = function(input, allowed) {
// Strips HTML and PHP tags from a string
//
// version: 1009.2513
// discuss at: http://phpjs.org/functions/strip_tags
// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +   improved by: Luke Godfrey
// +      input by: Pul
// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +   bugfixed by: Onno Marsman
// +      input by: Alex
// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +      input by: Marc Palau
// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +      input by: Brett Zamir (http://brett-zamir.me)
// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +   bugfixed by: Eric Nagel
// +      input by: Bobby Drake
// +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +   bugfixed by: Tomasz Wesolowski
// +      input by: Evertjan Garretsen
// +    revised by: Rafał Kukawski (http://blog.kukawski.pl/)
// *     example 1: strip_tags('<p>Kevin</p> <b>van</b> <i>Zonneveld</i>', '<i><b>');
// *     returns 1: 'Kevin <b>van</b> <i>Zonneveld</i>'
// *     example 2: strip_tags('<p>Kevin <img src="someimage.png" onmouseover="someFunction()">van <i>Zonneveld</i></p>', '<p>');
// *     returns 2: '<p>Kevin van Zonneveld</p>'
// *     example 3: strip_tags("<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>", "<a>");
// *     returns 3: '<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>'
// *     example 4: strip_tags('1 < 5 5 > 1');
// *     returns 4: '1 < 5 5 > 1'
// *     example 5: strip_tags('1 <br/> 1');
// *     returns 5: '1  1'
// *     example 6: strip_tags('1 <br/> 1', '<br>');
// *     returns 6: '1  1'
// *     example 7: strip_tags('1 <br/> 1', '<br><br/>');
// *     returns 7: '1 <br/> 1'
   allowed = (((allowed || "") + "")
      .toLowerCase()
      .match(/<[a-z][a-z0-9]*>/g) || [])
      .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
   var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
       commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
   return input.replace(commentsAndPhpTags, '').replace(tags, function($0, $1){
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
   });
}

// Collection of functions operating on content nodes
var ContentNode = {
  getTeaser: function(node) {
    if (node.type.key === "/type/section")
      return node.get('name') ? node.get('name').trim().substring(0, 15)+" ..." : "Section";      
    else if (node.type.key === "/type/text")
      return _.stripTags(node.get('content')).trim().substring(0, 15)+" ...";
    else if (node.type.key === "/type/image")
      return "Image";
    else if (node.type.key === "/type/resource")
      return "Resource";
    else if (node.type.key === "/type/quote")
      return "Quote";
    else if (node.type.key === "/type/code")
      return "Code";  
    return "N/A"
  }
}
var renderControls = function(node, first, last, parent, level) {
  
  function render(node, destination, consolidate) {
    var actions = new Data.Hash();
    var innerNode = null;
    var path = [];
    
    // Ensure correct order
    actions.set('/type/section', []);
    actions.set('/type/text', []);
    actions.set('/type/image', []);
    actions.set('/type/resource', []);
    actions.set('/type/quote', []);
    actions.set('/type/code', []);
    
    function computeActions(n, parent) {
      function registerAction(action) {
        if (action.nodeType === '/type/section' && action.level > 3) return;
        // if (actions.get(action.nodeType)) {
        if (action.nodeType === '/type/section') {
          var SORT_BY_LEVEL = function(v1, v2) {
            return v1.level === v2.level ? 0 : (v1.level < v2.level ? -1 : 1);
          }
          var choices = actions.get(action.nodeType);
          choices.push(action);
          choices.sort(SORT_BY_LEVEL);
          actions.set(action.nodeType, choices);
        } else if (!actions.get(action.nodeType)[0] || action.level > actions.get(action.nodeType)[0].level) {
          // Always use deepest level for leave nodes!
          actions.set(action.nodeType, [action]);
        }
      }
      
      var nlevel = parseInt($('#'+n.html_id).attr('level'));
      innerNode = n;
      n.level = nlevel;
      if (nlevel<=3) path.push(n);
      
      // Possible children
      if (n.all('children') && n.all('children').length === 0 && destination === 'after') {
        var children = n.properties().get('children').expectedTypes;
        
        _.each(children, function(type) {
          registerAction({
            node: n._id,
            parentNode: parent ? parent._id : null,
            nodeType: type,
            nodeTypeName: graph.get(type).name,
            insertionType: 'child',
            level: nlevel+1
          });
        });
      }

      // Possible siblings
      if (parent) {
        var siblings = parent.properties().get('children').expectedTypes;
        _.each(siblings, function(type) {
          registerAction({
            node: n._id,
            parentNode: parent ? parent._id : null,
            nodeType: type,
            nodeTypeName: graph.get(type).name,
            insertionType: 'sibling',
            level: nlevel
          });
        });
      }
      
      // Consolidate actions for child elements
      if (consolidate && n.all('children') && n.all('children').length > 0) {
        computeActions(n.all('children').last(), n);
      }
      return actions;
    }
    computeActions(node, parent);
    
    // Move insertion type for leaf nodes
    var moveInsertionType = innerNode.all('children') && innerNode.all('children').length === 0 && destination === 'after' ? "child" : "sibling";
    
    return _.tpl('controls', {
      node: innerNode,
      insertion_type: moveInsertionType,
      destination: destination,
      actions: actions,
      path: path
    });
  }
  
  // Top level
  if (!parent) {
    // Cleanup
    $('#document .controls').remove();
    if (!node.all('children') || node.all('children').length === 0) {
      $(render(node, 'after')).appendTo($('#'+node.html_id));
    }
  } else {
    //  Insert before, but only for starting nodes (first=true)
    if (first) $(render(node, 'before')).insertBefore($('#'+node.html_id));
    
    if (!last || parent.types().get('/type/document')) {
      $(render(node, 'after', true)).insertAfter($('#'+node.html_id));
    }
  }
  
  if (node.all('children')) {
    // Do the same for all children
    node.all('children').each(function(child, key, index) {
      var first = index === 0;
      var last = index === node.all('children').length-1;
      renderControls(child, first, last, node, level + 1);
    });
  }
};

// HTMLRenderer
// ---------------

var HTMLRenderer = function(root, parent, lvl) {
  
  // Implement node types
  var renderers = {
    "/type/document": function(node, parent, level) {
      var content = '',
          children = node.all('children');
      
      if (children) {
        children.each(function(child, key, index) {
          if (!child.type) console.log(node._id+ "has an unreferenced child" + key);
          content += renderers[child.type._id](child, node, level+1);
        });
      }
      
      return _.tpl('document', {
        node: node,
        toc: new TOCRenderer(node).render(),
        content: content,
        edit: app.document.mode === 'edit',
        title: app.document.mode === 'edit' ? node.get('title') : node.get('title') || 'Untitled',
        lead: node.get('lead'),
        empty_lead: app.document.mode === 'edit' && (!node.get('lead') || node.get('lead') === ''),
        empty_title: app.document.mode === 'edit' && (!node.get('title') || node.get('title') === ''),
        level: level
      });
    },
    
    "/type/story": function(node, parent, level) {
      return renderers["/type/document"](node, parent, level)
    },
    
    "/type/conversation": function(node, parent, level) {
      return renderers["/type/document"](node, parent, level)
    },
    
    "/type/article": function(node, parent, level) {
      return renderers["/type/document"](node, parent, level)
    },
    
    "/type/manual": function(node, parent, level) {
      return renderers["/type/document"](node, parent, level)
    },
    
    "/type/qaa": function(node, parent, level) {
      return renderers["/type/document"](node, parent, level)
    },
    
    "/type/section": function(node, parent, level) {
      var content = '',
          children = node.all('children');
      
      if (children) {
        node.all('children').each(function(child, key, index) { 
          content += renderers[child.type._id](child, node, level+1);
        });
      }
      
      return Helpers.renderTemplate('section', {
        node: node,
        comments: node.get('comments') && node.get('comments').length>0 ? node.get('comments').length : "",
        parent: parent,
        content: content,
        heading_level: level,
        level: level,
        edit: app.document.mode === 'edit',
        name: node.get('name'),
        empty: app.document.mode === 'edit' && (!node.get('name') || node.get('name') === '')
      });
    },
    
    "/type/text": function(node, parent, level) {
      return _.tpl('text', {
        node: node,
        comments: node.get('comments') && node.get('comments').length>0 ? node.get('comments').length : "",
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content'),
        empty: app.document.mode === 'edit' && (!node.get('content') || node.get('content') === '<p></p>'),
        level: level
      });
    },
    
    "/type/quote": function(node, parent, level) {
      return Helpers.renderTemplate('quote', {
        node: node,
        comments: node.get('comments') && node.get('comments').length>0 ? node.get('comments').length : "",
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content'),
        author: node.get('author'),
        empty_content: app.document.mode === 'edit' && (!node.get('content') || node.get('content') === ''),
        empty_author: app.document.mode === 'edit' && (!node.get('author') || node.get('author') === ''),
        level: level
      });
    },
    
    "/type/code": function(node, parent, level) {
      return Helpers.renderTemplate('code', {
        node: node,
        comments: node.get('comments') && node.get('comments').length>0 ? node.get('comments').length : "",
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content'),
        empty: app.document.mode === 'edit' && (!node.get('content') || node.get('content') === ''),
        level: level
      });
    },
    
    "/type/question": function(node, parent, level) {
      return Helpers.renderTemplate('question', {
        node: node,
        comments: node.get('comments') && node.get('comments').length>0 ? node.get('comments').length : "",
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content'),
        empty: app.document.mode === 'edit' && (!node.get('content') || node.get('content') === ''),
        level: level
      });
    },
    
    "/type/answer": function(node, parent, level) {
      return Helpers.renderTemplate('answer', {
        node: node,
        comments: node.get('comments') && node.get('comments').length>0 ? node.get('comments').length : "",
        parent: parent,
        edit: app.document.mode === 'edit',
        content: node.get('content'),
        empty: app.document.mode === 'edit' && (!node.get('content') || node.get('content') === ''),
        level: level
      });
    },
    
    "/type/image": function(node, parent, level) {
      return _.tpl('image', {
        node: node,
        comments: node.get('comments') && node.get('comments').length>0 ? node.get('comments').length : "",
        parent: parent,
        edit: app.document.mode === 'edit',
        url: node.get('url'),
        original_url: node.get('original_url'),
        level: level,
        empty: app.document.mode === 'edit' && (!node.get('caption') || node.get('caption') === ''),
        caption: node.get('caption'),
        transloadit_params: config.transloadit
      });
    },
    
    "/type/resource": function(node, parent, level) {
      return Helpers.renderTemplate('resource', {
        node: node,
        comments: node.get('comments') && node.get('comments').length>0 ? node.get('comments').length : "",
        parent: parent,
        edit: app.document.mode === 'edit',
        url: node.get('url'),
        level: level,
        empty: app.document.mode === 'edit' && (!node.get('caption') || node.get('caption') === ''),
        caption: node.get('caption'),
        transloadit_params: config.transloadit
      });
    },
    
    "/type/visualization": function(node, parent, level) {
      return Helpers.renderTemplate('visualization', {
        node: node,
        comments: node.get('comments') && node.get('comments').length>0 ? node.get('comments').length : "",
        parent: parent,
        edit: app.document.mode === 'edit',
        visualization_type: node.get('visualization_type'),
        data_source: node.get('data_source'),
        level: level
      });
    }
  };

  return {
    render: function() {
      // Traverse the document
      return renderers[root.type._id](root, parent, parseInt(lvl));
    }
  };
};


var TOCRenderer = function(root) {
  
  // Known node types
  var renderers = {
    "/type/document": function(node) {
      content = '<ol>';
      node.all('children').each(function(child) {
        if (child.type.key !== '/type/section') return;
        content += '<li><a class="toc-item" node="'+child.html_id+'" href="#'+root.get('creator')._id.split('/')[2]+'/'+root.get('name')+'/'+child.html_id+'">'+child.get('name')+'</a>';
        
        content += renderers["/type/document"](child);
        content += '</li>';
      });
      content += '</ol>';
      return content;
    },
    
    "/type/story": function(node) {
      return renderers["/type/document"](node);
    },
    
    "/type/conversation": function(node) {
      return "";
    },
    
    "/type/manual": function(node, parent) {
      return renderers["/type/document"](node, parent);
    },
    
    "/type/article": function(node, parent) {
      return renderers["/type/document"](node, parent);
    },
    
    "/type/qaa": function(node, parent) {
      return renderers["/type/document"](node, parent);
    }
  };

  return {
    render: function() {
      // Traverse the document
      return renderers[root.type._id](root);
    }
  };
};
var DocumentEditor = Backbone.View.extend({
  events: {
    'keydown .property': 'updateNode'
  },
  
  initialize: function() {
    var that = this;
    
    this.$node = $('#' + app.document.selectedNode.html_id + ' > .document-title.content').unbind();
    this.$lead = $('#' + app.document.selectedNode.html_id + ' #document_lead').unbind();
    
    function activateTitleEditor() {
      editor.activate(that.$node, {
        multiline: false,
        markup: false,
        placeholder: 'Enter Title'
      });
      editor.bind('changed', function() {
        that.updateNode({title: editor.content()});
      });
    }
    
    function activateLeadEditor() {
      editor.activate(that.$lead, {
        multiline: false,
        markup: false,
        placeholder: 'Enter lead'
      });
      editor.bind('changed', function() {
        that.updateNode({lead: editor.content()});
      });
    }
    
    that.$node.bind('click', activateTitleEditor);
    that.$lead.bind('click', activateLeadEditor);
    
    function makeSelection() {
      if (document.activeElement === that.$node[0]) {
        activateTitleEditor();
      } else {
        activateLeadEditor();
      }
    }
    makeSelection();
    return true;
  },
  
  updateNode: function(attrs) {
    app.document.updateSelectedNode(attrs);
    app.document.trigger('changed');
  }
});
var SectionEditor = Backbone.View.extend({
  
  initialize: function() {
    var that = this;
    this.render();
    this.$node = $('#' + app.document.selectedNode.html_id + ' > .content').attr('contenteditable', true).unbind();
    
    editor.activate(this.$node, {
      placeholder: 'Enter Section Name',
      multiline: false,
      markup: false
    });
    
    editor.bind('changed', function() {
      app.document.updateSelectedNode({
        name: editor.content()
      });
    });
  },
  
  render: function() {
  }
});

var TextEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();

    this.$content = this.$('div.content');
    editor.activate(this.$content, {
      placeholder: 'Enter Text',
      controlsTarget: $(this.el) // $('#document_actions')
    });
    
    // Update node when editor commands are applied
    editor.bind('changed', function() {
      app.document.updateSelectedNode({
        content: editor.content()
      });
    });
  },
  
  render: function() {
    
  }
});

var QuoteEditor = Backbone.View.extend({
  events: {
    
  },
  
  initialize: function() {
    var that = this;

    this.$content = this.$('.quote-content').unbind();
    this.$author = this.$('.quote-author').unbind();
    
    function activateContentEditor() {
      editor.activate(that.$content, {
        multiline: false,
        markup: false,
        placeholder: 'Enter Quote'
      });
      editor.bind('changed', function() {
        that.updateNode({content: editor.content()});
      });
    }
    
    function activateAuthorEditor() {
      editor.activate(that.$author, {
        multiline: false,
        markup: false,
        placeholder: 'Enter Author'
      });
      editor.bind('changed', function() {
        that.updateNode({author: editor.content()});
      });
    }
    
    that.$content.bind('click', activateContentEditor);
    that.$author.bind('click', activateAuthorEditor);
    
    function makeSelection() {
      if (document.activeElement === that.$author[0]) {
        activateAuthorEditor();
      } else {
        activateContentEditor();
      }
    }
    
    makeSelection();
    return true;
  },
  
  updateNode: function(attrs) {
    app.document.updateSelectedNode(attrs);
    app.document.trigger('changed');
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});

var CodeEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
        
    this.$content = this.$('.content');
    editor.activate(this.$content, {
      placeholder: 'Enter Code',
      controlsTarget: $('#document_actions'),
      markup: false
    });
    
    // Update node when editor commands are applied
    editor.bind('changed', function() {
      app.document.updateSelectedNode({
        content: editor.content()
      });
    });
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});

var QuestionEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    this.$content = this.$('.content');
    
    editor.activate(this.$content, {
      multiline: false,
      markup: false
    });
    
    // Update node when editor commands are applied
    editor.bind('changed', function() {
      app.document.updateSelectedNode({
        content: editor.content()
      });
    });
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});

var AnswerEditor = Backbone.View.extend({
  events: {

  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    this.$content = this.$('.content');
    editor.activate(this.$content, {
      placeholder: 'Enter Answer',
      controlsTarget: $('#document_actions')
    });
    
    // Update node when editor commands are applied
    editor.bind('changed', function() {
      that.updateNode();
    });
  },

  updateNode: function() {
    var that = this;
    
    setTimeout(function() {
      app.document.updateSelectedNode({
        content: editor.content()
      });
    }, 5);
  },
  
  render: function() {
    // $(this.el).html(Helpers.renderTemplate('edit_text', app.editor.model.selectedNode.data));
  }
});

var ImageEditor = Backbone.View.extend({
  events: {
    'change .image-file ': 'upload'
  },
  
  upload: function() {
    this.$('.upload-image-form').submit();
  },
  
  initialize: function() {
    var that = this;
    
    this.$caption = this.$('.caption');
    
    editor.activate(this.$caption, {
      placeholder: 'Enter Caption',
      multiline: false,
      markup: false
    });
    
    editor.bind('changed', function() {
      app.document.updateSelectedNode({
        caption: editor.content()
      });
    });
    
    this.$('.upload-image-form').transloadit({
      modal: false,
      wait: true,
      autoSubmit: false,
      onProgress: function(bytesReceived, bytesExpected) {
        var percentage = parseInt(bytesReceived / bytesExpected * 100);
        if (!(percentage >= 0)) percentage = 0;
        that.$('.image-progress .label').html('Uploading ... '+ percentage+'%');
        that.$('.progress-bar').attr('style', 'width:' + percentage +'%');
      },
      // onError: function(assembly) {
      //   alert(JSON.stringify(assembly));
      //   that.$('.image-progress .label').html('Invalid image. Skipping ...');
      //   that.$('.progress-container').hide();
      // 
      //   setTimeout(function() {
      //     app.document.reset();
      //     that.$('.info').show();
      //   }, 3000);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
      // },
      onStart: function() {
        that.$('.image-progress').show();
        that.$('.info').hide();
        that.$('.image-progress .label').html('Uploading ...');
        that.$('.progress-bar').attr('style', 'width: 0%');
      },
      onSuccess: function(assembly) {
        // This triggers a node re-render
        if (assembly.results.web_version && assembly.results.web_version[1] && assembly.results.web_version[1].url) {
          app.document.updateSelectedNode({
            url: assembly.results.web_version[1].url,
            original_url: assembly.results.print_version[1].url,
            dirty: true
          });
          
          app.document.reset();
          that.$('.progress-container').hide();
          that.$('.info').show();
        } else {
          that.$('.image-progress .label').html('Invalid image. Skipping ...');
          that.$('.progress-container').hide();

          setTimeout(function() {
            app.document.reset();
            that.$('.info').show();
          }, 3000);
        }
      }
    });
  },
  
  render: function() {
    // this.$('.node-editor-placeholder').html(Helpers.renderTemplate('edit_image', app.document.selectedNode.data));
  }
});
var ResourceEditor = Backbone.View.extend({
  events: {
    'change .image-file': 'upload',
    'keydown .resource-url': 'update'
  },
  
  resourceExists: function(url, callback) {
    var img = new Image();
    img.onload = function() { callback(null); }
    img.onerror = function() { callback('not found'); }
    img.src = url;
  },
  
  update: function() {
    var that = this;
    
    function perform() {
      var url = that.$('.resource-url').val();
      that.resourceExists(url, function(err) {
        if (!err) {
          that.$('.resource-content img').attr('src', url);
          that.$('.status').replaceWith('<div class="status image">Image</div>');
          app.document.updateSelectedNode({
            url: url
          });
        } else {
          that.$('.status').replaceWith('<div class="status">Invalid URL</div>');
        }
      });      
    }
    
    setTimeout(perform, 500);
  },
  
  initialize: function() {
    var that = this;
    
    this.pendingCheck = false;
    this.$caption = this.$('.caption');
    editor.activate(this.$caption, {
      placeholder: 'Enter Caption',
      multiline: false,
      markup: false
    });
    
    editor.bind('changed', function() {
      app.document.updateSelectedNode({
        caption: editor.content()
      });
    });
  },
  
  render: function() {
    
  }
});
// Top level UI namespace

var UI = {};

UI.StringEditor = Backbone.View.extend({
  events: {
    'change input': 'updateValue'
  },
  
  initialize: function(options) {
    var that = this;
    this._value = options.value;
    
    // Re-render on every change
    this.bind('changed', function() {
      that.render();
    });
    
    // Finally, render
    this.render();
  },
  
  // Add a new value for the property
  updateValue: function(e) {
    var val = this.$('input[name=value]').val();

    this._value = val;
    this.trigger('changed');
    this.render(); // re-render
    
    return false;
  },
  
  // Get the current set of values
  value: function() {
    return this._value;
  },
  
  // Render the editor, including the display of values
  render: function() {
    $(this.el).html(_.renderTemplate('string_editor', {
      value: this._value
    }));
  }
});
UI.MultiStringEditor = Backbone.View.extend({
  events: {
    'submit form': 'newItem',
    'click a.remove-item': 'removeItem',
    'click .available-item a': 'selectAvailableItem',
    'keydown input': 'inputChange',
    'click input': 'initInput',
    'blur input': 'reset'
  },
  
  initialize: function(options) {
    var that = this;
    this._items = options.items || [];
    this._availableItems = options.availableItems;
    
    // Re-render on every change
    this.bind('changed', function() {
      that.render();
    });
    
    // Finally, render
    this.render();
  },
  
  initInput: function() {
    // this.updateSuggestions();
  },
  
  reset: function() {
    this.$('.available-items').empty();
  },
  
  inputChange: function(e) {
    var that = this;
    
    var suggestions = this.$('.available-item');
    if (e.keyCode === 40) { // down-key
      if (this.selectedIndex < suggestions.length-1) this.selectedIndex += 1;
      this.teaseSuggestion();
    } else if (e.keyCode === 38){ // up-key
      if (this.selectedIndex>=0) this.selectedIndex -= 1;
      this.teaseSuggestion();
    } else {
      setTimeout(function() {
        that.trigger('input:changed', that.$('input[name=new_value]').val());
      }, 200);
    }
  },
  
  teaseSuggestion: function() {
    var suggestions = this.$('.available-item');
    this.$('.available-item.selected').removeClass('selected');
    if (this.selectedIndex>=0 && this.selectedIndex < this.$('.available-item').length) {
      $(this.$('.available-item')[this.selectedIndex]).addClass('selected');
    }
  },
  
  // Update matched suggestions
  updateSuggestions: function(suggestions) {
    var that = this;
    that.$('.available-items').empty();
    _.each(suggestions, function(item, key) {
      that.$('.available-items').append($('<div class="available-item"><a href="#" id="'+item._id+'" name="'+item.name+'" value="'+item.name+'">'+item.name+'</a></div>'));
    });
    this.selectedIndex = -1;
  },
  
  selectAvailableItem: function(e) {
    this.$('input[name=new_value]').val($(e.currentTarget).attr('value'));
    this.$('input[name=new_value]').focus();
    return false;
  },
  
  // Add a new value for the property
  newItem: function(e) {
    if (this.selectedIndex >= 0) {
      this.$('input[name=new_value]').val(this.$('.available-item.selected a').attr('value'));
    }
        
    var val = this.$('input[name=new_value]').val();
    if (!_.include(this._items, val) && val.length > 0) {
      this._items.push(val); 
      this.trigger('changed');
      this.render(); // re-render
      this.$('input[name=new_value]').focus();
    } else {
      this.trigger('error:alreadyexists');
    }
    return false;
  },
  
  // Remove a certain value
  removeItem: function(e) {
    var val = $(e.target).attr('value');
    this._items = _.reject(this._items, function(v) { return v === val; });
    this.trigger('changed');
    return false;
  },
  
  // Get the current value [= Array of values]
  value: function() {
    return this._items;
  },
  
  // Render the editor, including the display of values
  render: function() {
    $(this.el).html(_.renderTemplate('multi_string_editor', {
      items: this._items
    }));
  }
});
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
    'click a.unpublish-document': 'unpublishDocument',
    'click a.publish-document': 'publishDocument',
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
    
    // Actions
    'click a.add_child': 'addChild',
    'click a.add_sibling': 'addSibling',
    'click a.remove-node': 'removeNode'
  },
  
  loadedDocuments: {},
  
  toggleExport: function() {
    $('#document_settings').hide();
    $('.view-action-icon.settings').removeClass('active');
    $('#document_export').slideToggle();
    $('.view-action-icon.export').toggleClass('active');
    return false;
  },
  
  toggleSettings: function() {
    $('#document_export').hide();
    $('.view-action-icon.export').removeClass('active');
    
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
  
  loadDocument: function(username, docname, nodeid, commentid, mode) {
    var that = this;
    
    $('#tabs').show();
    function init(id) {
      that.model = graph.get(id);
      
      if (that.mode === 'edit' && !head.browser.webkit) {
        alert("You need to use a Webkit-based browser (Google Chrome, Safari) in order to write documents. In future, other browers will be supported too.");
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
      url: "/documents/"+username+"/"+docname,
      dataType: "json",
      success: function(res) {
        that.mode = mode || (res.authorized ? "edit" : "show");
        if (res.status === 'error') {
          printError(res.error)
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
var DocumentSettings = Backbone.View.extend({
  events: {
    'submit form': 'invite',
    'change select.change-mode': 'changeMode',
    'click a.remove-collaborator': 'removeCollaborator'
  },
  
  changeMode: function(e) {
    var collaboratorId = $(e.currentTarget).attr('collaborator');
    var mode = $(e.currentTarget).val();
    
    graph.get(collaboratorId).set({
      mode: mode
    });
    // trigger immediate sync
    graph.sync();
    
    return false;
  },
  
  removeCollaborator: function(e) {
    var collaboratorId = $(e.currentTarget).attr('collaborator');
    graph.del(collaboratorId);
    // trigger immediate sync
    graph.sync();
    this.collaborators.del(collaboratorId);
    this.render();
    return false;
  },
  
  invite: function() {
    var that = this;
    $.ajax({
      type: "POST",
      url: "/invite",
      data: {
        email: $('#collaborator_email').val(),
        document: app.document.model._id,
        mode: $('#collaborator_mode').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return alert(res.error);
        that.load();
      },
      error: function(err) {
        alert("Unknown error occurred");
      }
    });
    
    return false;
  },
  
  load: function() {
    var that = this;
    graph.fetch({"type": "/type/collaborator", "document": app.document.model._id}, function(err, nodes) {
      that.collaborators = nodes;
      that.render();
    });
  },
  
  initialize: function() {
    this.el = '#document_settings';
  },
  
  render: function() {
    $(this.el).html(_.tpl('document_settings', {
      collaborators: this.collaborators,
      document: app.document.model
    }));
    this.delegateEvents();
  }
});

var ConfirmCollaboration = Backbone.View.extend({
  
  events: {
    "click a.option-tab": "selectOption",
    "submit #login-form": "login",
    "submit #signup-form": "register",
    "submit #confirm-form": "doConfirm"
  },
  
  initialize: function(tan) {
    var that = this;
    this.el = '#content_wrapper';
    this.tan = tan;
    
    graph.fetch({"type": "/type/collaborator", "tan": this.tan, "document": {}}, function(err, nodes) {
      that.document = nodes.select(function(n) {
        return n.types().get('/type/document');
      }).first();
      that.collaborator = nodes.select(function(n) {
        return n.types().get('/type/collaborator');
      }).first();
      that.render();
    });
  },
  
  selectOption: function(e) {
    var option = $(e.currentTarget).attr('option');
    this.$('.option').removeClass('active');
    this.$('.option-tab').removeClass('active');
    this.$('.option.'+option).addClass('active');
    this.$('.option-tab.'+option).addClass('active');
    return false;
  },
  
  doConfirm: function() {
    var that = this;
    this.confirm(function(err) {
      if (err) return alert('Collaboration could not be confirmed. '+err.error);
      window.location.href = "/"+that.document.get('creator')._id.split('/')[2]+"/"+that.document.get('name');
    });
    return false;
  },

  confirm: function(callback) {
    $.ajax({
      type: "POST",
      url: "/confirm_collaborator",
      data: {
        tan: this.tan,
        user: app.username
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return callback({error: res.error});
        callback(null);
      },
      error: function(err) {
        callback({error: "Error occurred"});
      }
    });
  },
  
  login: function(e) {
    var that = this;
    app.authenticate(this.$('.username').val(), this.$('.password').val(), function(err) {
      if (err) return notifier.notify(Notifications.AUTHENTICATION_FAILED);
      that.confirm(function(err) {
        if (err) return alert('Collaboration could not be confirmed. '+err.error);
        window.location.href = "/"+that.document.get('creator')._id.split('/')[2]+"/"+that.document.get('name');
      });
    });
    return false;
  },
  
  register: function() {
    var that = this;
    $('.page-content .input-message').empty();
    $('#registration_error_message').empty();
    $('.page-content input').removeClass('error');
    
    app.createUser($('#signup_user').val(), $('#signup_name').val(), $('#signup_email').val(), $('#signup_password').val(), function(err, res) {
      if (err) {
        if (res.field === "username") {
          $('#signup_user').addClass('error');
          $('#signup_user_message').html(res.message);
        } else {
          $('#registration_error_message').html(res.message);
        }
      } else {
        graph.merge(res.seed);
        notifier.notify(Notifications.AUTHENTICATED);
        app.username = res.username;          
        that.trigger('authenticated');
        app.render();
        
        that.confirm(function(err) {
          if (err) return alert('Collaboration could not be confirmed. '+err.error);
          window.location.href = "/"+that.document.get('creator')._id.split('/')[2]+"/"+that.document.get('name');
        });
      }
    });
    return false;
  },
  
  render: function() {
    // Forward to document if authorized.
    var user = this.collaborator.get('user');
    if (user && user._id === "/user/"+app.username) {
      window.location.href = "/"+this.document.get('creator')._id.split('/')[2]+"/"+this.document.get('name');
      return;
    }
    
    $(this.el).html(_.tpl('confirm_collaboration', {
      collaborator: this.collaborator,
      document: this.document
    }));
    this.delegateEvents();
  }
});

var RecoverPassword = Backbone.View.extend({
  events: {
    'submit form': 'requestReset'
  },
  
  requestReset: function() {
    var that = this;
    $.ajax({
      type: "POST",
      url: "/recover_password",
      data: {
        username: $('#username').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return $('#registration_error_message').html('Username does not exist.');
        $('.recover').hide();
        $('.success').show();
      },
      error: function(err) {
        $('#registration_error_message').html('Username does not exist.');
      }
    });
    return false;
  },
  
  initialize: function() {
    this.el = '#content_wrapper';
    this.render();
  },
  
  render: function() {
    $(this.el).html(_.tpl('recover_password', {}));
    this.delegateEvents();
  }
});
var ResetPassword = Backbone.View.extend({
  events: {
    'submit form': 'resetPassword'
  },
  
  resetPassword: function() {
    if ($('#password').val() !== $('#password_confirmation').val()) {
      return alert('Password and confirmation do not match!');
    }
    
    var that = this;
    $.ajax({
      type: "POST",
      url: "/reset_password",
      data: {
        username: that.username,
        tan: that.tan,
        password: $('#password').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.status === "error") return $('#registration_error_message').html(res.message);
        window.location.href = "/"+that.username;
      },
      error: function(err) {
        $('#registration_error_message').html('Unknown error.');
      }
    });
    return false;
  },
  
  initialize: function(username, tan) {
    this.username = username;
    this.tan = tan;
    this.el = '#content_wrapper';
    this.render();
  },
  
  render: function() {
    $(this.el).html(_.tpl('reset_password', {}));
    this.delegateEvents();
  }
});
var Attributes = Backbone.View.extend({
  
  initialize: function() {
    this.el = '#attributes';
  },
  
  render: function() {
    app.document.mode === 'edit' ? this.renderEdit() : this.renderShow();
  },
  
  renderShow: function() {
    var that = this; 
    var doc = app.document.model;
    var attributes = [];
    
    var attributes = doc.properties().select(function(property) {
      if (property.expectedTypes[0] === '/type/attribute') {
        return true;
      }
    });
    
    $(this.el).html(_.tpl('show_attributes', {
      attributes: attributes,
      doc: doc
    }));
  },
  
  availableAttributes: function(property) {
    return graph.find({
      "type|=": ['/type/attribute'],
      member_of: '/'+ property.type._id.split('/')[2]+'/'+property.key
    });
  },
  
  renderEdit: function() {
    var that = this; 
    var doc = app.document.model;
    var attributes = [];
    
    var attributes = doc.properties().select(function(property) {
      if (property.expectedTypes[0] === '/type/attribute') {
        return true;
      }
    });
    
    $(this.el).html(_.tpl('edit_attributes', {
      attributes: attributes,
      doc: doc
    }));
    
    // Initialize AttributeEditors for non-unique-strings
    $('.attribute-editor').each(function() {
      var member_of = $(this).attr('property');
      var property = graph.get('/type/'+member_of.split('/')[1]).get('properties', member_of.split('/')[2]),
          key = $(this).attr('key'),
          unique = $(this).hasClass('unique'),
          type = $(this).attr('type');
          
          // property value / might be an array or a single value
          value = unique 
                  ? app.document.model.get(key).get('name') 
                  : _.map(app.document.model.get(key).values(), function(v) { return v.get('name'); });
    
      var editor = that.createAttributeEditor(key, type, unique, value, $(this));
      editor.bind('input:changed', function(value) {
        if (value.length < 2) return editor.updateSuggestions({});
        $.ajax({
          type: "GET",
          data: {
            member: member_of,
            search_str: value
          },
          url: "/attributes",
          dataType: "json"
        }).success(function(res) {
          graph.merge(res.graph);
          editor.updateSuggestions(res.graph);
        });
      });
      
      editor.bind('changed', function() {        
        var attrs = [];

        _.each(editor.value(), function(val) {
          // Find existing attribute
          var attr = graph.find({
            "type|=": ['/type/attribute'],
            member_of: member_of,
            name: val
          }).first();
          
          if (!attr) {
            // Create attribute as it doesn't exist
            attr = graph.set(null, {
              type: ["/type/attribute"],
              member_of: member_of,
              name: val
            });
          }
          attrs.push(attr._id);
        });
        
        // Update document
        var tmp = {};
        tmp[key] = attrs;
        app.document.model.set(tmp);
        app.document.trigger('changed');
      });
    });
  },
  
  createAttributeEditor: function(key, type, unique, value, target) {
    switch (type) {
      case 'string':
        if (unique) {
          return this.createStringEditor(key, value, target);
        } else {
          return this.createMultiStringEditor(key, value, target);
        }
      break;
      case 'number':
      break;
      case 'boolean':
      break;
    }
  },
  
  createMultiStringEditor: function(key, value, target) {
    var that = this;
    var editor = new UI.MultiStringEditor({
      el: target,
      items: value
    });
    return editor;
  },
  
  createStringEditor: function(key, value, target) {
    var that = this;
    var editor = new UI.StringEditor({
      el: target,
      value: value
    });
    return editor;
  }
});

// AddCriterion
// ---------------

var AddCriterion = function(app, options) {
  this.app = app;
  this.options = options;
};

// [c1, c2, !c1]  => [c2]
AddCriterion.prototype.matchesInverse = function(other) {
  return (
    other instanceof RemoveCriterion && 
    this.options.property === other.options.property && 
    this.options.operator === 'CONTAINS' && other.options.operator === 'CONTAINS' &&
    this.options.value === other.options.value
  );
};

// [c1, c2, c1~]  => [c1~, c2]
// eg. c1 = population > 2000000, c1~ = population > 10000000
AddCriterion.prototype.matchesOverride = function() {
  // TODO: implement
};

AddCriterion.prototype.execute = function() {
  this.graph = app.browser.graph;
  
  var criterion = new Data.Criterion(this.options.operator, '/type/document', this.options.property, this.options.value);
  app.browser.graph = app.browser.graph.filter(criterion);
  
  this.app.facets.addChoice(this.options.property, this.options.operator, this.options.value);
};

AddCriterion.prototype.unexecute = function() {
  app.browser.graph = this.graph; // restore the old state
  this.app.facets.removeChoice(this.options.property, this.options.operator, this.options.value);
};


// RemoveCriterion
// ---------------

var RemoveCriterion = function(app, options) {
  this.app = app;
  this.options = options;
};

RemoveCriterion.prototype.execute = function() {
  // won't be executed
};

RemoveCriterion.prototype.unexecute = function() {
  // won't be unexecuted
};

var DocumentBrowser = Backbone.View.extend({
  events: {
    'click a.add-criterion': 'addCriterion',
    'click a.remove-criterion': 'removeCriterion'
  },
  
  addCriterion: function(e) {
    var property = $(e.currentTarget).attr('property'),
        operator = $(e.currentTarget).attr('operator'),
        value = $(e.currentTarget).attr('value');

    this.applyCommand({command: 'add_criterion', options: {
      property: property,
      operator: operator,
      value: value
    }});
    this.render();
    return false;
  },
  
  removeCriterion: function(e) {
    var property = $(e.currentTarget).attr('property'),
        operator = $(e.currentTarget).attr('operator'),
        value = $(e.currentTarget).attr('value');

    this.applyCommand({command: 'remove_criterion', options: {
      property: property,
      operator: operator,
      value: value
    }});
    this.render();
    return false;
  },
  
  initialize: function(options) {
    var that = this;
    this.app = options.app;
    this.browserTab = new BrowserTab({el: '#browser_tab', browser: this});
    this.documents = [];
    this.commands = [];
    this.graph = new Data.Graph(seed);
  },
  
  // Modfies query state (reflected in the BrowserTab)
  load: function(query) {
    var that = this;
    this.query = query;
    
    $('#browser_tab').show().html('&nbsp;&nbsp;&nbsp;Loading documents...');
    $('#browser_wrapper').html('');
    $.ajax({
      type: "GET",
      url: "/documents/search/"+query.type+"/"+encodeURI(query.value),
      dataType: "json",
      success: function(res) {
        that.graph = new Data.Graph(seed);
        that.graph.merge(res.graph);
        that.facets = new Facets({browser: that});
        that.loaded = true;
        that.trigger('loaded');
        that.render();
      },
      error: function(err) {}
    });
  },
  
  render: function() {
    var that = this;
    if (this.loaded) {
      this.documents = this.graph.find({"type|=": "/type/document"});
      var DESC_BY_UPDATED_AT = function(item1, item2) {
        var v1 = item1.value.get('updated_at'),
            v2 = item2.value.get('updated_at');
        return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
      };
      
      this.documents = this.documents.sort(DESC_BY_UPDATED_AT);
      $(this.el).html(_.tpl('document_browser', {
        documents: this.documents,
        user: that.query.type === 'user' ? that.graph.get('/user/'+that.query.value) : null,
        query: that.query
      }));
      
      if (this.loaded) this.facets.render();
      this.browserTab.render();
    }
  },
  
  // Takes a command spec and applies the command
  applyCommand: function(spec) {
    var cmd;
    
    if (spec.command === 'add_criterion') {
      cmd = new AddCriterion(this, spec.options);
    } else if (spec.command === 'remove_criterion') {
      cmd = new RemoveCriterion(this, spec.options);
    }

    // remove follow-up commands (redo-able commands)
    if (this.currentCommand < this.commands.length-1) {
      this.commands.splice(this.currentCommand+1);
    }

    // insertion position
    var pos = undefined;
    $.each(this.commands, function(index, c) {
      if (c.matchesInverse(cmd)) {
        pos = index;
      }
    });

    if (pos >= 0) {
      // restore state
      this.commands[pos].unexecute();
      // remove matched inverse command
      this.commands.splice(pos, 1);
      // execute all follow-up commands [pos..this.commands.length-1]
      for (var i=pos; i < this.commands.length; i++) {
        this.commands[i].execute();
      }
    } else {
      this.commands.push(cmd);
      cmd.execute();
    }

    this.currentCommand = this.commands.length-1;
    return cmd;
  },
  
  undo: function() {
    if (this.currentCommand >= 0) {
      this.commands[this.currentCommand].unexecute();
      this.currentCommand -= 1;
      this.render();    
    }
  },

  redo: function() {
    if (this.currentCommand < this.commands.length-1) {
      this.currentCommand += 1;
      this.commands[this.currentCommand].execute();
      this.render();    
    }
  }
});

var Facets = Backbone.View.extend({
  initialize: function(options) {
    this.browser = options.browser;
    this.facetChoices = {};
    this.el = '#facets';
  },
  
  select: function(property) {
    $('.facet').removeClass('selected');
    $('#facet_'+property).toggleClass('selected');
  },
  
  addChoice: function(property, operator, value) {
    // TODO: build flexible lookup for arbitrary operators (GT, LT etc.)
    this.facetChoices[property+'::'+operator+'::'+value] = true;
  },
  
  removeChoice: function(property, operator, value) {
    delete this.facetChoices[property+'::'+operator+'::'+value];
  },
  
  buildView: function() {
    var that = this;
    var view = {facets: []};
    
    // Properties for all registered document_types
    var properties = new Data.Hash();
    app.browser.graph.get('/config/substance').get('document_types').each(function(type, key) {
      properties = properties.union(app.browser.graph.get(type).properties());
    });
    
    app.browser.graph.get('/type/document').all('properties').each(function(property, key) {
      if (property.meta.facet) {
        var facet_choices = [];
        var selected_facet_choices = [];
        property.all("values").each(function(value) {
          if (that.facetChoices[key+'::CONTAINS::'+value._id] === true) {
            selected_facet_choices.push({key: escape(value._id), value: value.toString(), item_count: value.referencedObjects.length});
          } else {
            facet_choices.push({key: escape(value._id), value: value.toString(), item_count: value.referencedObjects.length});
          }
        });
        
        if (facet_choices.length + selected_facet_choices.length > 0) {
          view.facets.push({
            property: key,
            property_name: property.name,
            facet_choices: facet_choices,
            selected_facet_choices: selected_facet_choices
          });
        }
      }
    });
    return view;
  },
  
  render: function() {
    var that = this;
    $(this.el).html(_.renderTemplate('facets', this.buildView()));
  }
});

var Collaborators = Backbone.View.extend({
  
  initialize: function() {
    this.render();
  },
  
  render: function() {    
    $(this.el).html(Helpers.renderTemplate('collaborators', {
      status: app.editor.status,
      id: app.editor.model.id,
      author: app.editor.model.author,
      name: app.editor.model.name,
      hostname: window.location.hostname + (window.location.port !== 80 ? ":" + window.location.port : "")
    }));
  }
});

var UserSettings = Backbone.View.extend({
  events: {
    'submit form': 'updateUser'
  },
  
  updateUser: function() {
    if (this.$('#user_password').val() === "" || this.$('#user_password').val() === this.$('#user_password_confirmation').val()) {
      $.ajax({
        type: "POST",
        url: "/updateuser",
        data: {
          username: this.$('#user_username').val(),
          name: this.$('#user_name').val(),
          email: this.$('#user_email').val(),
          password: this.$('#user_password').val(),
          website: this.$('#user_website').val(),
          company: this.$('#user_company').val(),
          location: this.$('#user_location').val()
        },
        dataType: "json",
        success: function(res) {
          if (res.status === 'error') {
            notifier.notify({
              message: 'An error occured. Check your input',
              type: 'error'
            });
          } else {
            graph.merge(res.seed);
            app.username = res.username;
            app.render();
            
            app.document.closeDocument();
            app.browser.load(app.query());

            app.browser.bind('loaded', function() {
              app.toggleView('browser');
            });

            router.navigate(app.username);
          }
        },
        error: function(err) {
          notifier.notify({
            message: 'An error occured. Check your input',
            type: 'error'
          });
        }
      });
    } else {
      notifier.notify({
        message: 'Password and confirmation do not match.',
        type: 'error'
      });
    }
    return false;
  },
  
  initialize: function() {
    
  },
  
  render: function() {
    $(this.el).html(_.tpl('user_settings', {
      user: graph.get('/user/'+app.username)
    }));
  }
});
var NewDocument = Backbone.View.extend({
  
  initialize: function() {
    
  },
  
  render: function() {    
    $(this.el).html(_.tpl('new_document', {}));
  }
});
var BrowserTab = Backbone.View.extend({
  events: {
    'submit #search_form': 'loadDocuments',
    'keydown #search': 'search',
    'focus #search': 'focusSearch',
    'blur #search': 'blurSearch'
  },
  
  focusSearch: function(e) {
    this.searchValue = $(e.currentTarget).val();
    this.active = true;
    $(e.currentTarget).val('');
  },
  
  blurSearch: function(e) {
    var that = this;
    this.active = false;
    setTimeout(function() {
      that.render();
    }, 200);
  },
  
  // Performs a search on the document repository based on a search string
  // Returns a list of matching user names and one entry for matching documents
  search: function(e) {
    if (e.keyCode === 27) return this.blurSearch();
    var that = this;
    if ($('#search').val() === '') return;
    
    if (!that.pendingSearch) {
      that.pendingSearch = true;
      setTimeout(function() {
        that.pendingSearch = false;
        
        if (that.active && $('#search').val() !== '') {
          
          $.ajax({
             type: "GET",
             url: "/quicksearch/"+encodeURI($('#search').val()),
             dataType: "json",
             success: function(res) {               
               // Render results
               that.$('.results').html('');
               that.$('.results').append($('<a href="/search/'+encodeURI($('#search').val())+'" class="result-item documents">'+res.document_count+' Documents / '+_.keys(res.users).length+' Users</a>'));
               _.each(res.users, function(user, key) {
                 that.$('.results').append($('<a href="/'+user.username+'" class="result-item user"><div class="username">'+user.username+'</div><div class="full-name">'+(user.name ? user.name : '')+'</div><div class="count">User</div></a>'));
               });
               $('#browser_tab .results').show();
             },
             error: function(err) {}
           });
        }
        // Sanitize on every registered change
      }, 500);
    }
  },
  
  // Finally perform a real search
  loadDocuments: function() {
    app.searchDocs($('#search').val());
    this.active = false;
    return false;
  },
  
  loadUser: function() {
    
  },
  
  initialize: function(options) {
    this.browser = options.browser;
  },
  
  render: function() {
    var queryDescr;
    
    if (this.browser.query) {
      switch (this.browser.query.type){
        case 'user': queryDescr = this.browser.query.value+"'s documents"; break;
        case 'recent': queryDescr = 'Recent Documents'; break;
        case 'subscribed': queryDescr = 'Subscribed Documents'; break;
        default : queryDescr = 'Documents for &quot;'+this.browser.query.value+'&quot;';
      }
    } else {
      queryDescr = 'Type to search ...';
    }
    
    $(this.el).html(_.tpl('browser_tab', {
      documents: this.browser.documents,
      query_descr: queryDescr,
      query: this.browser.query
    }));
  }
});


var Header = Backbone.View.extend({
  events: {
    'focus #login-user': 'focusUser',
    'blur #login-user': 'blurUser',
    'focus #login-password': 'focusPassword',
    'blur #login-password': 'blurPassword'
  },
  
  initialize: function(options) {
    
  },
  
  focusUser: function(e) {
    var input = $(e.currentTarget)
    if (input.hasClass('hint')) {
      input.val('');
      input.removeClass('hint');
    }
  },
  
  blurUser: function(e) {
    var input = $(e.currentTarget)
    if (input.val() === '') {
      input.addClass('hint');
      input.val('Username');
    }
  },
  
  focusPassword: function(e) {
    var input = $(e.currentTarget)
    if (input.hasClass('hint')) {
      input.val('');
      input.removeClass('hint');
    }
  },
  
  blurPassword: function(e) {
    var input = $(e.currentTarget)
    if (input.val() === '') {
      input.addClass('hint');
      input.val('Password');
    }
  },

  render: function() {
    var username = this.options.app.username;
    var notifications = graph.find({"type|=": "/type/notification", "recipient": "/user/"+username});

    var SORT_BY_DATE_DESC = function(v1, v2) {
      var v1 = v1.value.get('created_at'),
          v2 = v2.value.get('created_at');
      return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
    }
    
    notifications = notifications.sort(SORT_BY_DATE_DESC);
    
    // Render login-state
    $(this.el).html(_.tpl('header', {
      user: graph.get('/user/'+username),
      notifications: notifications,
      count: notifications.select(function(n) { return !n.get('read')}).length,
      notifications_active: this.notificationsActive
    }));
  }
});
// The Router
// ---------------

var Router = Backbone.Router.extend({
  initialize: function() {
    // Using this.route, because order matters
    this.route(":username", "user", app.userDocs);
    this.route(":username/:docname/:node/:comment", "comment", this.loadDocument);
    this.route(":username/:docname/:node", "node", this.loadDocument);
    this.route(":username/:docname", "document", this.loadDocument);
    
    this.route("reset/:username/:tan", "reset", this.resetPassword);
    this.route("subscribed", "subscribed", app.subscribedDocs);
    this.route("recent", "recent", app.recentDocs);
    this.route("collaborate/:tan", "collaborate", this.collaborate);
    this.route("search/:searchstr", "search", app.searchDocs);
    this.route("register", "register", app.toggleSignup);
    this.route("recover", "recover", this.recoverPassword);
    
    this.route("", "startpage", app.toggleStartpage);
  },
  
  // Confirm invitation
  collaborate: function(tan) {
    $('#content_wrapper').attr('url', "collaborate/"+tan);
    var view = new ConfirmCollaboration(tan);
    
    app.toggleView('content');
    $('#header').hide();
    $('#tabs').hide();
    $('#footer').hide();
    
    return false;
  },
    
  recoverPassword: function() {
    $('#content_wrapper').attr('url', "recover");
    var view = new RecoverPassword();
    
    app.toggleView('content');
    $('#header').hide();
    $('#tabs').hide();
    $('#footer').hide();
    
    return false;
  },
  
  resetPassword: function(username, tan) {
    $('#content_wrapper').attr('url', "reset/"+username+"/"+tan);
    var view = new ResetPassword(username, tan);
    
    app.toggleView('content');
    $('#header').hide();
    $('#tabs').hide();
    $('#footer').hide();
    
    return false;
  },
  
  loadDocument: function(username, docname, node, comment) {
    app.browser.load({"type": "user", "value": username});
    app.document.loadDocument(username, docname, node, comment);
    $('#document_wrapper').attr('url', username+'/'+docname+(node ? "/"+node : "")+(comment ? "/"+comment : ""));
    $('#browser_wrapper').attr('url', username);
    return false;
  }
});


// The Application
// ---------------

// This is the top-level piece of UI.
var Application = Backbone.View.extend({
  events: {
    'click .new-document': 'newDocument',
    'click a.load-document': 'loadDocument',
    'click a.signup': 'toggleSignup',
    'click .tab': 'switchTab',
    'click a.show-attributes': 'showAttributes',
    'submit #create_document': 'createDocument',
    'submit #login-form': 'login',
    'click a.delete-document': 'deleteDocument',
    'click a.toggle-signup': 'toggleSignup',
    'click a.toggle-startpage': 'toggleStartpage',
    'click a.toggle-edit-mode': 'toggleEditMode',
    'click a.toggle-show-mode': 'toggleShowMode',
    'click .toggle.logout': 'logout',
    'click .toggle.user-settings': 'toggleUserSettings',
    'click .toggle.user-profile': 'toggleUserProfile',
    'submit #signup-form': 'registerUser',
    'click .toggle.notifications': 'toggleNotifications',
    'click .toggle-toc': 'toggleTOC',
    'click #event_notifications a .notification': 'hideNotifications',
    'click #toc_wrapper': 'toggleTOC',
    'click a.open-notification': 'openNotification',
    'change #document_name': 'updateDocumentName',
    'click a.toggle-recent': 'toggleRecent',
    'click a.toggle-subscribed': 'toggleSubscribed',
    'click a.toggle-userdocs': 'toggleUserDocs'
  },
  
  // Event handlers
  // ---------------
  
  toggleRecent: function() {
    this.recentDocs();
    return false;
  },
  
  toggleSubscribed: function() {
    this.subscribedDocs();
    return false;
  },
  
  toggleUserDocs: function() {
    this.userDocs(app.username);
    return false;
  },
  
  userDocs: function(username) {
    app.browser.load({"type": "user", "value": username});
    $('#browser_wrapper').attr('url', username);
    
    app.browser.bind('loaded', function() {
      app.toggleView('browser');
      app.browser.unbind('loaded');
    });
    return false;
  },
  
  updateDocumentName: function(e) {
    var name = $(e.currentTarget).val();
    this.checkDocumentName(name, function(valid) {
      if (valid) {
        app.document.updateName(name);
        router.navigate(app.username+'/'+name);
      } else {
        $('#document_name').val(app.document.model.get('name'));
        alert('Sorry, this name is already taken.');
      }
    });
    return false;
  },
  
  login: function(e) {
    var that = this;
    this.authenticate($('#login-user').val(), $('#login-password').val(), function(err) {
      if (err) return notifier.notify(Notifications.AUTHENTICATION_FAILED);
      that.trigger('authenticated');
    });
    return false;
  },
  
  openNotification: function(e) {
    var url = $(e.currentTarget).attr('href');
    var urlParts = url.replace('#', '').split('/');
    app.document.loadDocument(urlParts[0], urlParts[1], urlParts[2], urlParts[3]);
    $('#document_wrapper').attr('url', url);
    return false;
  },
  
  // Actions
  // ---------------
  
  recentDocs: function() {
    app.browser.load({"type": "recent", "value": 50});
    $('#browser_wrapper').attr('url', "recent");
    
    app.browser.bind('loaded', function() {
      app.toggleView('browser');
      app.browser.unbind('loaded');
    });
    return false;
  },
  
  subscribedDocs: function() {
    app.browser.load({"type": "subscribed", "value": 50});
    $('#browser_wrapper').attr('url', "subscribed");
    
    app.browser.bind('loaded', function() {
      app.toggleView('browser');
      app.browser.unbind('loaded');
    });
    return false;
  },
  
  searchDocs: function(searchstr) {
    app.browser.load({"type": "keyword", "value": encodeURI(searchstr)});
    $('#browser_wrapper').attr('url', 'search/'+encodeURI(searchstr));
    app.browser.bind('loaded', function() {
      app.toggleView('browser');
    });
  },
  
  toggleStartpage: function() {
    app.browser.browserTab.render();
    $('#content_wrapper').html(_.tpl('startpage'));
    
    // Initialize Slider
    $('#slider').nivoSlider({
      manualAdvance: true
    });
    
    // Initialize Flattr
    var s = document.createElement('script'), t = document.getElementsByTagName('script')[0];
    s.type = 'text/javascript';
    s.async = true;
    s.src = 'http://api.flattr.com/js/0.6/load.js?mode=auto';
    t.parentNode.insertBefore(s, t);

    app.toggleView('content');
    return false;
  },
    
  // Triggered by toggleNotifications
  // Triggers markAllRead
  showNotifications: function() {
    this.header.notificationsActive = true;
    this.header.render();
  },
  
  toggleTOC: function() {
    if ($('#toc_wrapper').is(":hidden")) {
      $('#document .board').addClass('active');
      $('#toc_wrapper').slideDown();
      $('#toc_wrapper').css('top', Math.max(_.scrollTop()-$('#document').offset().top, 0));
    } else {
      $('#document .board').removeClass('active');
      $('#toc_wrapper').slideUp();
    }

    return false;
  },
  
  // Triggered by toggleNotifications and when clicking a notification
  // Triggers count reset (to zero)
  hideNotifications: function() {
    // Mark all notifications as read
    var notifications = graph.find({"type|=": "/type/notification", "recipient": "/user/"+app.username});
    var unread = notifications.select(function(n) { return !n.get('read')});
    unread.each(function(n) {
      n.set({read: true});
    });
    this.header.notificationsActive = false;
    this.header.render();
  },
  
  toggleNotifications: function() {
    $('#event_notifications').hasClass('active') ? this.hideNotifications() : this.showNotifications();
    return false;
  },
  
  loadNotifications: function() {
    var that = this;
    $.ajax({
      type: "GET",
      url: "/notifications",
      dataType: "json",
      success: function(notifications) {
        var newNodes = {};
        _.each(notifications, function(n, key) {
          // Only merge in if not already there
          if (!graph.get(key)) {
            newNodes[key] = n;
          }
        });
        graph.merge(newNodes);
        that.header.render();
      }
    });
  },
  
  toggleUserProfile: function() {
    var that = this;
    app.browser.load({"type": "user", "value": this.username});
    app.browser.bind('loaded', function() {
      app.toggleView('browser');
      $('#browser_wrapper').attr('url', that.username);
      app.browser.unbind('loaded');
    });
  },
  
  newDocument: function() {
    if (!head.browser.webkit) {
      alert("You need to use a Webkit based browser (Google Chrome, Safari) in order to write documents. In future, other browers will be supported too.");
      return false;
    }
    this.content = new NewDocument({el: '#content_wrapper'});
    this.content.render();
    
    this.toggleView('content');
    return false;
  },
  
  scrollTo: function(id) {
    var offset = $('#'+id).offset();                             
    offset ? $('html, body').animate({scrollTop: offset.top}, 'slow') : null;
    return false;
  },
  
  toggleUserSettings: function() {
    this.content = new UserSettings({el: '#content_wrapper'});
    this.content.render();
    this.toggleView('content');    
    return false;
  },
  
  toggleSignup: function() {
    $('#content_wrapper').attr('url', "register");
    app.browser.browserTab.render();
    $('#content_wrapper').html(_.tpl('signup'));
    app.toggleView('content');
    return false;
  },
  
  switchTab: function(e) {
    this.toggleView($(e.currentTarget).attr('view'));
  },
  
  toggleView: function(view) {
    $('.tab').removeClass('active');
    $('#'+view+'_tab').addClass('active');
    if (view === 'browser' && !this.browser.loaded) return;
    $('.view').hide();
    $('#'+view+'_wrapper').show();
    
    // Show stuff - inverting of this.collaborate();
    $('#header').show();
    $('#tabs').show();
    $('#footer').show();

    // Wait until url update got injected
    setTimeout(function() {
      router.navigate($('#'+view+'_wrapper').attr('url'));
    }, 10);
    return false;
  },
  
  checkDocumentName: function(name, callback) {
    if (new RegExp(graph.get('/type/document').get('properties', 'name').validator).test(name)) {      
      // TODO: find a more efficient way to check for existing docs.
      $.ajax({
        type: "GET",
        url: "/documents/"+app.username+"/"+name,
        dataType: "json",
        success: function(res) {
          res.status === 'error' ? callback(true) : callback(false);
        },
        error: function(err) {
          callback(true); // Not found. Fine.
        }
      });
      return false;
    } else {
      callback(false);
    }
  },
  
  createDocument: function(e) {
    var that = this;
    var title = $('#create_document input[name=new_document_name]').val();
    var name = _.slug(title);
    var type = "/type/article"; // $('#create_document select[name=document_type]').val();
    
    this.checkDocumentName(name, function(valid) {
      if (valid) {
        that.document.newDocument(type, name, title);
      } else {
        $('#create_document input[name=new_document_name]').addClass('error');
        $('#new_document_name_message').html('This document name is already taken.');
      }
    });
    
    return false;
  },
  
  toggleEditMode: function(e) {
    var user = app.document.model.get('creator')._id.split('/')[2];
    var name = app.document.model.get('name');
    
    app.document.loadDocument(user, name, null, null, 'edit');
    return false;
  },
  
  toggleShowMode: function(e) {
    var user = app.document.model.get('creator')._id.split('/')[2];
    var name = app.document.model.get('name');
    
    app.document.loadDocument(user, name, null, null, 'show');
    return false;
  },
  
  loadDocument: function(e) {
      var user = $(e.currentTarget).attr('user').toLowerCase();
          name = $(e.currentTarget).attr('name');

      app.document.loadDocument(user, name, null,  null);
      if (router) {
        router.navigate($(e.currentTarget).attr('href'));
        $('#document_wrapper').attr('url', $(e.currentTarget).attr('href'));
      }
    return false;
  },
  
  // Handle top level events
  // -------------
  
  showAttributes: function() {
    app.document.drawer.toggle('Attributes');
    $('.show-attributes').toggleClass('selected');
    return false;
  },
  
  logout: function() {
    var that = this;
    
    $.ajax({
      type: "POST",
      url: "/logout",
      dataType: "json",
      success: function(res) {
        // that.username = null;
        // that.authenticated = false;
        // that.render();
        // $('.new-document').hide();
        window.location.reload();
      }
    });
    return false;
  },
  
  deleteDocument: function(e) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.document.deleteDocument(app.document.model._id);
      this.document.closeDocument();
    }
    return false;
  },
  
  // Application Setup
  // -------------
  
  updateSystemStatus: function(status) {
    this.activeUsers = status.active_users;
  },
  
  query: function() {
    return this.authenticated ? { "type": "user", "value": this.username }
                              : { "type": "user", "value": "demo" }
  },
  
  initialize: function() {
    var that = this;
    
    // Initialize browser
    this.browser = new DocumentBrowser({
      el: this.$('#browser_wrapper'),
      app: this
    });
    
    // Initialize document
    this.document = new Document({el: '#document_wrapper', app: this});
    this.header = new Header({el: '#header', app: this});
    this.activeUsers = [];
    
    // Reset when clicking on the body
    $('body').click(function(e) {
      app.document.reset(true);
      return true;
    });
    
    // Cookie-based auto-authentication
    if (session.username) {
      graph.merge(session.seed);      
      this.authenticated = true;
      this.username = session.username;
      this.trigger('authenticated');
      $('#tabs').show();
      $('.new-document').show();
    } else {
      this.authenticated = false;
    }
    
    this.bind('authenticated', function() {
      // that.authenticated = true;
      // // Re-render browser
      // $('#tabs').show();
      // $('.new-document').show();
      // that.render();
      // that.browser.load(that.query());
      
      // Reload current page
      window.location.reload();
    });
    
    setInterval(function() {
      that.loadNotifications();
    }, 30000);
    
    that.render();
  },
  
  getFullDocument: function(id) {    
    var result = {};
    function addNode(id) {
      if (!result[id]) {
        var n = graph.get(id);
        result[id] = n.toJSON();

        // Resolve associated Nodes
        n.type.all('properties').each(function(p) {
          if (p.isObjectType()) {
            n.all(p.key).each(function(obj) {
              if (obj.type) addNode(obj._id);
            });
          }
        });
      }
    }
    addNode(id);
    return result;
  },
  
  authenticate: function(username, password, callback) {
    var that = this;
    $.ajax({
      type: "POST",
      url: "/login",
      data: {
        username: username,
        password: password
      },
      dataType: "json",
      success: function(res) {
        if (res.status === 'error') {
          callback({error: "authentication_failed"});
        } else {
          graph.merge(res.seed);
          that.username = res.username;
          callback(null);
        }
      },
      error: function(err) {
        callback({error: "authentication_failed"});
      }
    });
    return false;
  },
  
  registerUser: function() {
    var that = this;
    
    $('.page-content .input-message').empty();
    $('#registration_error_message').empty();
    $('.page-content input').removeClass('error');
    
    this.createUser($('#signup_user').val(), $('#signup_name').val(), $('#signup_email').val(), $('#signup_password').val(), function(err, res) {
      if (err) {
        if (res.field === "username") {
          $('#signup_user').addClass('error');
          $('#signup_user_message').html(res.message);
        } else {
          $('#registration_error_message').html(res.message);
        }
      } else {
        graph.merge(res.seed);
        notifier.notify(Notifications.AUTHENTICATED);
        that.username = res.username;          
        that.trigger('authenticated');
        router.navigate('', true);
      }
    });
    return false;
  },
  
  createUser: function(username, name, email, password, callback) {
    var that = this;
    $.ajax({
      type: "POST",
      url: "/register",
      data: {
        username: username,
        name: name,
        email: email,
        password: password
      },
      dataType: "json",
      success: function(res) {
        res.status === 'error' ? callback('error', res) : callback(null, res);
      },
      error: function(err) {
        alert("Unknown error. Couldn't create user.")
      }
    });
    return false;
  },
  
  // Should be rendered just once
  render: function() {
    var that = this;
    this.document.render();
    this.browser.render();
    this.header.render();
    return this;
  }
});

var remote,                              // Remote handle for server-side methods
    app,                                 // The Application
    router,                              // The Router
    editor,                              // A global instance of the Proper Richtext editor
    graph = new Data.Graph(seed, {dirty: false, syncMode: 'push'}).connect('ajax'); // The database


(function() {
  $(function() {    
    function browserSupported() {
      if (head.browser.mozilla && head.browser.version > "1.9.2") {
        return true;
      }
      if (head.browser.webkit && head.browser.version > "533.0") {
        return true;
      }
      if (head.browser.opera && head.browser.version > "11.0") {
        return true;
      }
      // if (head.browser.msie && head.browser.version > "9.0") {
      //   return true;
      // }
      return false;
    }
    
    if (!browserSupported()) {
      $('#container').html(_.tpl('browser_not_supported'));
      $('#container').show();
      return;
    }
    
    $('#container').show();
    
    window.positionBoard = function() {
      var wrapper = document.getElementById('document_wrapper');
      if (wrapper.offsetTop - _.scrollTop() < 0) {
        $('#document .board').addClass('docked');
        $('#document .board').css('left', ($('#document').offset().left)+'px');
        $('#document .board').css('width', ($('#document').width())+'px');
        
        var tocOffset = $('#toc_wrapper').offset();
        if (tocOffset && _.scrollTop() < tocOffset.top) {
          $('#toc_wrapper').css('top', _.scrollTop()-$('#document').offset().top+"px");
        }
      } else {
        $('#document .board').css('left', '');
        $('#toc_wrapper').css('top', 0);
        $('#document .board').removeClass('docked');
      }
    }
    
    positionBoard();
    
    $(window).bind('scroll', positionBoard);
    $(window).bind('resize', positionBoard);
    
    // Start the engines
    app = new Application({el: $('#container'), session: session});
    
    // Set up a global instance of the Proper Richtext Editor
    editor = new Proper();
    
    // Initialize router
    router = new Router({app: this});
    
    // Start responding to routes
    Backbone.history.start({pushState: true});
    

    // Reset document when window gets out of focus
    // document.body.onblur = function() {  if (app.document) app.document.reset(); }
    
    // TODO: Prevent leaving page by pressing backspace
    // $('body').bind('keydown', function(e) {
    //   if (!currently_editing && e.keyCode === 8 ) e.preventDefault();
    // });
    
    // Prevent exit when there are unsaved changes
    window.onbeforeunload = confirmExit;
    function confirmExit() {
      if (graph.dirtyNodes().length>0) return "You have unsynced changes, which will be lost.";
    }
     
    function resetWorkspace() {
      confirm('There are conflicted or rejected nodes since the last sync. The workspace will be reset for your own safety. Keep in mind we do not yet support simultaneous editing of one document.');
      window.location.reload(true);
    }
    
    var pendingSync = false;
    graph.bind('dirty', function() {
      // Reload document browser      
      if (!pendingSync) {
        pendingSync = true;
        setTimeout(function() {
          $('#sync_state').fadeIn(100);
          graph.sync(function(err) {
            pendingSync = false;
            if (!err) {
              setTimeout(function() {
                $('#sync_state').fadeOut(100);
              }, 1500);
            } else {
              resetWorkspace();
            }
          });
        }, 3000);
      }
    });
  });
})();
