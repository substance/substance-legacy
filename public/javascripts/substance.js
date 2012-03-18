// Provide top-level namespaces for our javascript.

(function() {
  window.s = {};
  s.model = {};
  s.util = {};
  s.views = {};
  s.app = {};
}());

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

// A fake console to calm down some browsers.
if (!window.console) {
  window.console = {
    log: function(msg) {
      // No-op
    }
  };
}

/**
 * Date.parse with progressive enhancement for ISO-8601, version 2
 * © 2010 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */
s.util.date = function (date) {
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

s.util.slug = function (str) {
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
};

// Render Underscore templates
s.util.tpl = function (tpl, ctx) {
  var source = templates[tpl];
  return _.template(source, ctx);
};

s.util.browserSupported = function () {
  if (head.browser.mozilla && head.browser.version > "1.9.2") {
    return true;
  }
  if (head.browser.webkit && head.browser.version > "533.0") {
    return true;
  }
  if (head.browser.opera && head.browser.version > "11.0") {
    return true;
  }
  // if (head.browser.ie && head.browser.version > "9.0") {
  //   return true;
  // }
  return false;
};

s.util.prettyDate = function (time) {
  return time ? jQuery.timeago(time) : "";
};

s.util.escape = function (s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
};

s.util.unescape = function (s) {
  return s.replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&gt;/g,   '>')
          .replace(/&lt;/g,   '<')
          .replace(/&amp;/g,  '&');
};
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
    $(this.el).html(_.tpl('string_editor', {
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
    $(this.el).html(_.tpl('multi_string_editor', {
      items: this._items
    }));
  }
});

// DocumentLens
// -------------

s.views.DocumentLens = Backbone.View.extend({

  id: 'document_lens',

  events: {
    'click a': 'scrollTo'
  },

  initialize: function (options) {
    _.bindAll(this);
    
    this.selectedItem = 0;
    this.start = 0;
    this.windowSize = 12;
    this.height = this.windowSize * 30;
  },

  scrollTo: function (e) {
    var node = $(e.currentTarget).attr('href').slice(1);
    var index = $(e.currentTarget).attr('data-index');
    app.scrollTo(node);
    setTimeout(_.bind(function() {
      this.selectSection(index);
      // TODO: view dependency alert
      this.model.document.prevSection = index;
    }, this), 40);
    
    return false;
  },

  getBounds: function() {
    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    start = clamp(this.selectedItem-(this.windowSize-1)/2, 0, this.model.items.length-this.windowSize);
    return [start, start+this.windowSize-1];
  },

  selectSection: function(item) {
    this.selectedItem = item;

    this.$('.items .item.selected').removeClass('selected');
    this.$($('.items .item')[item]).addClass('selected');
    this.$('.outline .outline-item').removeClass('selected');
    this.$($('.outline .outline-item')[item]).addClass('selected');
    this.$('.items').scrollTop(this.getBounds()[0]*30);
  },

  render: function () {
    var bounds = this.getBounds();
    var that = this;
    $(this.el).html(s.util.tpl('document_lens', {
      items: this.model.items,
      bounds: bounds,
      selectedItem: this.selectedItem
    }));

    this.$('.items').scroll(function(e) {
      e.preventDefault();
      e.stopPropagation();

      start = Math.round($(this).scrollTop()/30);
      $('.outline .outline-item').removeClass('active').each(function(i) {
        if (i>=start && i<=start+that.windowSize-1) {
          $(this).addClass('active');
        }
      });
      return false;
    });

    this.$('.items').scrollTop(bounds[0]*30);
    var delta = Math.min(this.height/this.model.items.length, 30);
    this.$('.outline .outline-item').height(delta);

    return this;
  }
});

// Document
// -------------

s.views.Document = Backbone.View.extend({

  initialize: function (options) {
    _.bindAll(this);
    
    this.authorized   = options.authorized;
    this.published    = options.published;
    this.version      = options.version;

    var sections;
    function collectSections (node, level) {
      if (level === 1) sections = [];
      node.get('children').each(function (child) {
        if (child.type.key !== '/type/section') return;
        sections.push({id: child._id, html_id: child.html_id, name: child.get('name'), level: level});
        collectSections(child, level+1);
      });
      return sections;
    }

    collectSections(this.model, 1);

    this.node         = s.views.Node.create({ model: this.model, document: this });
    this.documentLens = new s.views.DocumentLens({ model: {items: sections, document: this}, authorized: this.authorized });
    this.settings     = new s.views.DocumentSettings({ model: this.model, authorized: this.authorized });
    this.publish      = new s.views.Publish({ model: this.model, docView: this, authorized: this.authorized });
    this.invite       = new s.views.Invite({ model: this.model, authorized: this.authorized });
    this["export"]    = new s.views.Export({ model: this.model, authorized: this.authorized });
    this.subscribers  = new s.views.Subscribers({ model: this.model, authorized: this.authorized });
    this.versions     = new s.views.Versions({ model: this.model, authorized: this.authorized });
    
    // TODO: Instead listen for a document-changed event
    graph.bind('dirty', _.bind(function(node) {
      this.updatePublishState();

      // Update TOC
      if (node.type._id === "/type/section") {
        // Recalc bounds every time content is changed
        this.calcBounds();
        setTimeout(_.bind(function() {
          this.documentLens.model.items = collectSections(this.model, 1);        
          this.documentLens.render();
        }, this), 2);
      }
    }, this));

    this.currentView = null;
    
    _.bindAll(this, 'deselect', 'onKeydown');
    $(document.body).keydown(this.onKeydown);
    if (!this.bounds) setTimeout(this.calcBounds, 400);
    $(window).scroll(this.markActiveSection);
  },

  render: function () {
    $(this.el).html(s.util.tpl('document', {
      doc: this.model,
      authorized: this.authorized
    }));
    
    $(this.documentLens.render().el).appendTo(this.$('#document'));
    $(this.node.render().el).appendTo(this.$('#document'));
    if (this.authorized && !this.version) { this.edit(); }
    this.$('#document_content').click(this.deselect);

    return this;
  },

  remove: function () {
    $(document.body).unbind('keydown', this.onKeydown);
    this.$('#document_content').unbind('click', this.deselect);
    $(this.el).remove();
    return this;
  },


  // Events
  // ------

  events: {
    'click .toggle-subscription': 'toggleSubscription',
    'click .settings':    'toggleSettings',
    'click .publish':     'togglePublish',
    'click .invite':      'toggleInvite',
    'click .subscribers': 'toggleSubscribers',
    'click .versions':    'toggleVersions',
    'click .export':      'toggleExport'
  },

  // Handlers
  // --------

  toggleSubscription: function (e) {
    if (!this.model.get('subscribed')) {
      subscribeDocument(this.model, _.bind(function (err) {
        this.$('.action.toggle-subscription a').html('Remove Bookmark');
        this.$('.tab.subscribers a').html(this.model.get('subscribers'));
      }, this));
    } else {
      unsubscribeDocument(this.model, _.bind(function (err) {
        this.$('.action.toggle-subscription a').html('Bookmark');
        this.$('.tab.subscribers a').html(this.model.get('subscribers'));
      }, this));
    }
    return false;
  },

  toggleSettings:    function (e) { this.toggleView('settings');    return false; },
  togglePublish:     function (e) { this.toggleView('publish');     return false; },
  toggleSubscribers: function (e) { this.toggleView('subscribers'); return false; },
  toggleVersions:    function (e) { this.toggleView('versions');    return false; },
  toggleInvite:      function (e) { this.toggleView('invite');      return false; },
  toggleExport:      function (e) { this.toggleView('export');      return false; },

  onKeydown: function (e) {
    if (e.keyCode === 27) {
      // Escape key
      this.deselect();
    }
  },


  // Helpers
  // -------

  updatePublishState: function () {
    $('#document_navigation .publish-state')
       .removeClass()
       .addClass("publish-state "+getPublishState(this.model));
  },

  edit: function () {
    this.node.transitionTo('write');
  },

  deselect: function () {
    if (this.node) {
      this.node.deselectNode();
      window.editor.deactivate();
      this.$(':focus').blur();
    }
  },

  // Calculate section bounds
  calcBounds: function() {
    var that = this;
    this.bounds = [];
    this.sections = [];
    $('#document .content-node.section').each(function() {
      that.bounds.push($(this).offset().top);
      that.sections.push(graph.get(this.id.replace(/_/g, '/')));
    });
  },

  markActiveSection: function() {
    var that = this;
    function getActiveSection() {
      var active = 0;
      _.each(that.bounds, function(bound, index) {
        if ($(window).scrollTop() >= bound-90) {
          active = index;
        }
      });
      return active;
    }

    function update(e) {
      that.activeSection = getActiveSection();
      if (that.activeSection !== that.prevSection) {
        that.prevSection = that.activeSection;
        that.documentLens.selectSection(that.activeSection);
      }
    }
    update();
  },

  resizeShelf: function () {
    var shelfHeight   = this.currentView ? $(this.currentView.el).outerHeight() : 0
    ,   contentMargin = shelfHeight + 100;
    this.$('#document_shelf').css({ height: shelfHeight + 'px' });
    this.$('#document_content').css({ 'margin-top': contentMargin + 'px' });
    this.$('#document_lens').css({ 'top': (contentMargin+40) + 'px' });
  },

  closeShelf: function() {
    if (!this.currentView) return;
    this.currentView.unbind('resize', this.resizeShelf);

    // It's important to use detach (not remove) to retain
    // the view's event handlers
    $(this.currentView.el).detach();

    this.currentView = null;
    this.$('.document.tab').removeClass('selected');
    this.resizeShelf();
  },

  toggleView: function (viewname) {
    var view = this[viewname];
    var shelf   = this.$('#document_shelf')
    ,   content = this.$('#document_content');
    
    if (this.currentView && this.currentView === view) return this.closeShelf();
    
    this.$('.document.tab').removeClass('selected');
    $('.document.tab.'+viewname).addClass('selected');
    view.load(_.bind(function (err) {
      view.bind('resize', this.resizeShelf);
      shelf.empty();
      shelf.append(view.el)
      this.currentView = view;
      view.render();
    }, this));
  }
});

s.views.Export = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_export',

  render: function () {
    $(this.el).html(s.util.tpl('document_export', {
      baseUrl: document.location.href
    }));
    this.trigger('resize');
    return this;
  },

  load: function (callback) { callback(null); }

});

s.views.Invite = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_invite',

  initialize: function () {
    _.bindAll(this);
    this.collaborators = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_invite', {
      collaborators: this.collaborators,
      document: this.model
    }));
    this.trigger('resize');
    return this;
  },

  load: function (callback) {
    if (this.collaborators) {
      callback(null);
    } else {
      getCollaborators(this.model, _.bind(function (err, nodes) {
        if (!err) {
          this.collaborators = nodes;
        }
        callback(err);
      }, this));
    }
  },


  // Events
  // ------

  events: {
    'submit form': 'invite',
    'change .change-mode': 'changeMode',
    'click .remove-collaborator': 'removeCollaborator'
  },

  changeMode: function (e) {
    var collaboratorId = $(e.currentTarget).attr('data-collaborator')
    ,   mode           = $(e.currentTarget).val();
    
    changeCollaboratorMode(collaboratorId, mode, _.bind(function (err) {
      this.render();
    }, this));
    
    return false;
  },

  removeCollaborator: function (e) {
    var collaboratorId = $(e.currentTarget).attr('data-collaborator');
    
    removeCollaborator(collaboratorId, _.bind(function (err) {
      this.collaborators.del(collaboratorId);
      this.render();
    }, this));
    
    return false;
  },

  invite: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var email = this.$('#collaborator_email').val()
    ,   mode  = this.$('#collaborator_mode').val();
    
    invite(email, this.model, mode, _.bind(function (err) {
      this.collaborators = null;
      this.load(this.render);
    }, this));
  }

});

s.views.Publish = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_publish',

  initialize: function (options) {
    _.bindAll(this);
    this.docView = options.docView;
    this.data = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_publish', {
      availableNetworks: this.data.availableNetworks,
      networks: this.data.networks,
      versions: this.data.versions,
      document: this.model
    }));

    this.trigger('resize');
    this.$("select.networks-selection").chosen();
    return this;
  },

  load: function (callback) {
    if (this.data) {
      callback(null);
    } else {
      loadPublish(this.model, _.bind(function (err, res) {
        if (!err) { this.data = res; }
        callback(err);
      }, this));
    }
  },


  // Events
  // ------

  events: {
    'click .publish-document': 'publishDocument',
    'click .unpublish-document': 'unpublishDocument'
  },

  publishDocument: function (e) {
    var networks = this.$('.networks-selection').val() || []
    ,   remark   = this.$('#version_remark').val();
    publishDocument(this.model, networks, remark, _.bind(function (err, res) {
      this.data = null;
      this.docView.updatePublishState();
      this.docView.closeShelf();
    }, this));
    return false;
  },

  unpublishDocument: function(e) {
    unpublishDocument(this.model, _.bind(function(err, res) {
      this.data = null;
      this.docView.updatePublishState();
      this.docView.closeShelf();
    }, this));
    return false;
  }

});

s.views.DocumentSettings = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_settings',

  initialize: function () {},

  initializeUploadForm: function () {
    _.bindAll(this, 'onStart', 'onProgress', 'onError');

    this.$('.upload-image-form').transloadit({
      modal: false,
      wait: true,
      autoSubmit: false,
      onStart: this.onStart,
      onProgress: this.onProgress,
      onError: this.onError,
      onSuccess: _.bind(function (assembly) {
        if (assembly.results.web_version &&
            assembly.results.web_version[1] &&
            assembly.results.web_version[1].url) {
          this.onSuccess(assembly);
        } else {
          this.onInvalid();
        }
      }, this)
    });
  },

  onStart: function () {
    this.$('.image-progress').show();
    this.$('.image-progress .label').html("Uploading &hellip;");
    this.$('.progress-bar').css('width', '0%');
  },

  onProgress: function (bytesReceived, bytesExpected) {
    var percentage = Math.max(0, parseInt(bytesReceived / bytesExpected * 100));
    if (!percentage) percentage = 0;
    this.$('.image-progress .label').html("Uploading &hellip; " + percentage + "%");
    this.$('.progress-bar').css('width', percentage + '%');
  },

  onSuccess: function (assembly) {
    this.$('.image-progress').hide();
    $('.upload-image-form img').attr('src', assembly.results.web_version[1].url);

    this.model.set({
      cover: assembly.results.web_version[1].url
    });
  },

  onError: function (assembly) {
    // TODO
  },

  onInvalid: function () {
    this.$('.image-progress .label').html("Invalid image. Skipping &hellip;");
    this.$('.image-progress').hide();
    
    setTimeout(_.bind(function () {
      this.$('.info').show();
    }, this), 3000);
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_settings', {
      doc: this.model,
      transloadit_params: config.transloadit.document_cover
    }));

    this.initializeUploadForm();
    this.trigger('resize');
    return this;
  },

  load: function (callback) { callback(null); },


  // Events
  // ------

  events: {
    'click .delete': 'deleteDocument',
    'keyup #new_name': 'changeName',
    'submit .rename': 'rename',
    'change .image-file': 'upload'
  },

  upload: function() {
    this.$('.upload-image-form').submit();
  },

  deleteDocument: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocument(this.model, function (err) {
        router.navigate('', true); // TODO
      });
    }
  },

  changeName: function (e) {
    e.preventDefault();
    e.stopPropagation();
  },

  rename: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var name = this.$('#new_name').val();
    this.$('.error').text("");
    updateDocumentName(this.model, name, _.bind(function (err) {
      if (err) {
        this.$('.error').text(err.message);
      } else {
        router.navigate(documentURL(this.model), false);
      }
    }, this));
  }

});

s.views.Subscribers = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_subscribers',

  initialize: function () {
    _.bindAll(this);
    this.data = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_subscribers', {
      document: this.model,
      subscriptions: this.data.subscriptions
    }));

    this.trigger('resize');
    return this;
  },

  load: function (callback) {
    if (this.data) {
      callback(null);
    } else {
      loadSubscribers(this.model, _.bind(function (err, res) {
        if (!err) { this.data = res; }
        callback(err);
      }, this));
    }
  },


  // Events
  // ------

  events: {
    
  }
});
s.views.Versions = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_versions',

  // Events
  // ------

  events: {
    'click .remove-version': '__removeVersion',
    'click .toggle-version': '__toggleVersion'
  },

  __toggleVersion: function(e) {
    
    var link  = $(e.currentTarget)
    ,   route = link.attr('href').replace(/^\//, '');
    router.navigate(route, true);
    return false;
  },

  __removeVersion: function (e) {
    var version = $(e.currentTarget).attr('data-version');
    removeVersion(this.model, version, _.bind(function () {
      this.data = null;
      this.load(this.render);
    }, this));
    return false;
  },

  initialize: function () {
    _.bindAll(this);
    this.data = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_versions', {
      document: this.model,
      versions: this.data.versions
    }));

    this.trigger('resize');
    return this;
  },

  load: function (callback) {
    if (this.data) {
      callback(null);
    } else {
      loadVersions(this.model, _.bind(function (err, res) {
        if (!err) { this.data = res; }
        callback(err);
      }, this));
    }
  }

});
s.views.ConfirmCollaboration = Backbone.View.extend({
  
  events: {
    "click a.option-tab": "selectOption",
    "submit #login-form": "login",
    "submit #signup-form": "register",
    "submit #confirm-form": "doConfirm"
  },
  
  initialize: function(tan) {
    var that = this;
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
      window.location.href = "/"+that.model.document.get('creator')._id.split('/')[2]+"/"+that.model.document.get('name');
    });
    return false;
  },

  confirm: function(callback) {
    $.ajax({
      type: "POST",
      url: "/confirm_collaborator",
      data: {
        tan: this.model.tan,
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
    login(this.$('.username').val(), this.$('.password').val(), function (err) {
      if (err) return notifier.notify(Notifications.AUTHENTICATION_FAILED);
      that.confirm(function(err) {
        if (err) return alert('Collaboration could not be confirmed. '+err.error);
        window.location.href = "/"+that.model.document.get('creator')._id.split('/')[2]+"/"+that.model.document.get('name');
      });
    });
    return false;
  },
  
  register: function() {
    var that = this;
    $('.page-content .input-message').empty();
    $('#registration_error_message').empty();
    $('.page-content input').removeClass('error');
    
    createUser($('#signup_user').val(), $('#signup_name').val(), $('#signup_email').val(), $('#signup_password').val(), function (err, res) {
      if (err) {
        if (res.field === "username") {
          $('#signup_user').addClass('error');
          $('#signup_user_message').html(res.message);
        } else {
          $('#registration_error_message').html(res.message);
        }
      } else {
        notifier.notify(Notifications.AUTHENTICATED);
        window.location.href = "/"+res.username;
      }
    });
    return false;
  },
  
  render: function() {
    // Forward to document if authorized.
    var user = this.model.collaborator.get('user');
    if (user && user._id === "/user/"+app.username) {
      window.location.href = "/"+this.document.get('creator')._id.split('/')[2]+"/"+this.document.get('name');
      return;
    }    
    $(this.el).html(s.util.tpl('confirm_collaboration', this.model));
    return this;
  }
});

s.views.RecoverPassword = Backbone.View.extend({

  events: {
    'submit form': 'requestReset'
  },

  requestReset: function (e) {
    var username = $('#username').val();
    requestPasswordReset(username, _.bind(function (err, res) {
      if (err) {
        $('#registration_error_message').html('Username does not exist.');
      } else {
        $('.recover').hide();
        $('.success').show();
      }
    }, this));
    return false;
  },

  render: function () {
    $(this.el).html(s.util.tpl('recover_password', {}));
    return this;
  }

});

s.views.ResetPassword = Backbone.View.extend({

  events: {
    'submit form': 'resetPassword'
  },

  resetPassword: function (e) {
    var password     = this.$('#password').val()
    ,   confirmation = this.$('#password_confirmation').val();
    
    if (password !== confirmation) {
      alert("Password and confirmation do not match!");
      return;
    }

    resetPassword(this.username, this.tan, password, _.bind(function (err, res) {
      if (err) {
        $('#registration_error_message').html(err);
      } else {
        window.location.href = "/";
      }
    }, this));
    
    return false;
  },

  initialize: function (options) {
    this.username = options.username;
    this.tan      = options.tan;
  },

  render: function() {
    $(this.el).html(s.util.tpl('reset_password', {}));
    return this;
  }

});

// Document
// ========

function createDoc (type, name, title) {
  var docType = graph.get(type);
  var doc = graph.set(Data.uuid('/document/'+app.username+'/'), docType.meta.template);
  doc.set({
    creator: '/user/' + app.username,
    created_at: new Date(),
    updated_at: new Date(),
    name: name,
    title: title
  });
  return doc;
}


// Nodes
// =====

// Position
// --------

function Position (parent, after) {
  this.parent = parent;
  this.after  = after;
}

Position.prototype.toString = function () {
  return 'new Position(' + this.parent + ', ' + this.after + ')';
};


function getDocument (node) {
  return node.get('document') || node; // node can be the document itself
}

function isSection (node) {
  return node.type.key === '/type/section';
}

function isLastChild (parent, child) {
  return parent.all('children').last() === child;
}

function removeChild (parent, child, temporary) {
  var wasLastChild = isLastChild(parent, child);
  parent.all('children').del(child._id);
  if (!temporary) { graph.del(child._id); }
  parent._dirty = true;
  child.trigger('removed');
  if (wasLastChild) { parent.trigger('last-child-changed'); }
}

function removeChildTemporary (parent, child) {
  removeChild(parent, child, true);
}

function addChild (node, position) {
  var parent = position.parent
  ,   after  = position.after;
  
  var targetIndex;
  if (after === null) {
    // Insert at the beginning.
    targetIndex = 0;
  } else {
    targetIndex = parent.all('children').index(after._id) + 1;
  }
  
  parent.all('children').set(node._id, node, targetIndex);
  parent._dirty = true;
  
  if (isSection(node)) {
    var lastSection = node, lastChild;
    while ((lastChild = lastSection.all('children').last()) && isSection(lastChild)) {
      lastSection = lastChild;
    }
    
    addFollowingSiblings(new Position(parent, node), lastSection);
  }
  
  parent.trigger('added-child', node, targetIndex);
  if (isLastChild(parent, node)) {
    parent.trigger('last-child-changed');
  }
}

function moveChild (oldParent, node, newPosition) {
  removeChildTemporary(oldParent, node);
  addChild(node, newPosition);
}

function createNode (type, position) {
  var newNode = graph.set(null, {
    type: type,
    document: getDocument(position.parent)._id
  });
  
  addChild(newNode, position);
  
  return newNode;
}

function getFollowingSiblings (position) {
  function slice (hash, n) {
    var sliced = new Data.Hash();
    hash.each(function (val, key, index) {
      if (index >= n) {
        sliced.set(key, val);
      }
    });
    return sliced;
  }
  
  var parent = position.parent
  ,   after  = position.after;
  
  var children = parent.all('children');
  return after === null ? children.clone()
                        : slice(children, children.index(after._id) + 1);
}

function addFollowingSiblings (position, section) {
  var parent = position.parent;
  var stop = false;
  getFollowingSiblings(position).each(function (sibling, ii, i) {
    if (stop || isSection(sibling)) {
      stop = true;
    } else {
      var position = new Position(section, section.all('children').last() || null);
      moveChild(parent, sibling, position);
    }
  });
}

function updateNode (node, attrs) {
  node.set(attrs);
  
  // Update modification date on original document
  getDocument(node).set({ updated_at: new Date() });
}

function possibleChildTypes (position, level) {
  var defaultOrder = [ '/type/section'
                     , '/type/text'
                     , '/type/image'
                     , '/type/resource'
                     , '/type/quote'
                     , '/type/code' ]
  
  function indexOf (element, array) {
    var i = array.indexOf(element);
    return i >= 0 ? i : Infinity;
  }
  
  function compareByDefaultOrder (a, b) {
    return indexOf(a, defaultOrder) < indexOf(b, defaultOrder) ? -1 : 1;
  }
  
  // Haskell's 'on' function from Data.Function
  function on (fn1, fn2) {
    return function (a, b) {
      return fn1(fn2(a), fn2(b));
    };
  }
  
  function getKey (val) { return val.key; }
  
  function recurse (position, val, level) {
    var parent = position.parent
    ,   after  = position.after;
    
    var expectedTypes = parent.properties().get('children').expectedTypes;
    _.each(expectedTypes, function (type) {
      if (!(type === '/type/section' && level > 3)) {
        var curr = val.get(type);
        if (curr) {
          curr.push(position);
        } else {
          val.set(type, [position]);
        }
      }
    });
    
    if (after && after.properties().get('children')) {
      recurse(new Position(after, after.all('children').last()), val, level + 1);
    }
    
    return val;
  }
  
  return recurse(position, new Data.Hash(), level).sort(on(compareByDefaultOrder, getKey));
}

function getTypeName (type) {
  return graph.get(type).name;
}

function moveTargetPositions (node, position, level) {
  function has (arr, el) {
    return arr.indexOf(el) >= 0;
  }
  
  function depth (n) {
    return isSection(n)
         ? 1 + Math.max(_.max(_.map(n.all('children').values(), depth)), 0)
         : 0;
  }
  
  var maxLevel = 4 - depth(node);
  
  function recurse (position, arr, level) {
    var parent = position.parent
    ,   after  = position.after;
    
    if (level > maxLevel) { return arr; }
    
    if (has(parent.properties().get('children').expectedTypes, node.type.key)) {
      arr.push(position);
    }
    
    if (after && after.properties().get('children')) {
      recurse(new Position(after, after.all('children').last() || null), arr, level + 1);
    }
    
    return arr;
  }
  
  return recurse(position, [], level);
}


// Comments
// ========

function loadComments (node, callback) {
  graph.fetch({ type: '/type/comment', node: node._id }, function (err, nodes) {
    if (err) { return callback(err, null); }
    var ASC_BY_CREATED_AT = function (item1, item2) {
      var v1 = item1.value.get('created_at')
      ,   v2 = item2.value.get('created_at');
      return v1 === v2 ? 0 : (v1 < v2 ? -1 : 1);
    };
    callback(null, nodes.sort(ASC_BY_CREATED_AT));
  });
}

function createComment (node, content, version, callback) {
  window.pendingSync = true;
  
  var comment = graph.set(null, {
    type: '/type/comment',
    creator: '/user/' + app.username,
    created_at: new Date(),
    content: content,
    node: node._id,
    document: node.get('document')._id,
    version: version ? '/version/'+node.get('document')._id.split('/')[3]+'/'+version : null
  });
  
  // Trigger immediate sync
  graph.sync(function (err) {
    window.pendingSync = false;
    if (err) callback(err, null);
    else     callback(null, comment);
  });
}

function removeComment (comment, callback) {
  window.pendingSync = true;
  graph.del(comment._id);
  graph.sync(function (err) {
    window.pendingSync = false;
    callback(err);
  });
}

function loadDocument (username, docname, version, callback) {
  $.ajax({
    type: "GET",
    url: version ? "/documents/"+username+"/"+docname+"/"+version : "/documents/"+username+"/"+docname,
    dataType: "json",
    success: function (res) {
      if (res.error) {
        callback(res, null);
      } else {
        graph.merge(res.graph);
        callback(null, {
          version: res.version,
          authorized: res.authorized,
          published: res.published,
          doc: graph.get(res.id)
        });
      }
    },
    error: function (err) {
      callback(err, null);
    }
  });
}


function sortByUpdatedAt (items) {
  var DESC_BY_UPDATED_AT = function(item1, item2) {
    var v1 = item1.value.get('updated_at'),
        v2 = item2.value.get('updated_at');
    return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
  };
  return items.sort(DESC_BY_UPDATED_AT);
}


function loadUserProfile (username, callback) {
  $.ajax({
    type: "GET",
    url: "/documents/"+username,
    dataType: "json",
    success: function (res) {
      var graph = new Data.Graph(seed);
      graph.merge(res.graph);
      
      // Populate results
      var documents = graph.find({"type|=": "/type/document"});
      callback(null, {
        documents: sortByUpdatedAt(documents),
        user: graph.get('/user/'+username)
      });
    },
    error: function(err) {
      callback(err);
    }
  });
}

function loadDashboard (query, callback) {
  this.query = query;
  
  $.ajax({
    type: "GET",
    url: "/dashboard.json",
    dataType: "json",
    success: function (res) {
      
      var graph = new Data.Graph(seed);
      graph.merge(res.graph);
      
      // Populate results
      var documents = graph.find({"type|=": "/type/document"});
      
      callback(null, {
        documents: sortByUpdatedAt(documents),
        user: graph.get('/user/'+session.username),
        bins: res.bins
      });
    },
    error: function(err) {
      callback(err);
    }
  });
}

function loadExplore (callback) {
  var graph = new Data.Graph(seed).connect('ajax');

  $.ajax({
    type: 'GET',
    url: '/networks/recent',
    dataType: 'json',
    success: function (res) {
      graph.merge(res.graph);
      
      // Populate results
      var networks  = graph.find({"type":   "/type/network"});
      callback(null, {
        networks: sortByUpdatedAt(networks)
      });
    },
    error: function (err) { callback(err); }
  });
}

function loadNetwork (network, callback) {
  $.ajax({
    type: "GET",
    url: "/network/"+network+".json",
    dataType: "json",
    success: function (res) {
      var g = new Data.Graph(seed);
      g.merge(res.graph);
      var network = g.find({"type": "/type/network"}).first();
      var sg = {};
      sg[network._id] = network.toJSON();
      graph.merge(sg, false);

      callback(null, {
        members: g.find({"type": "/type/user"}),
        network: graph.get(network._id),
        documents: sortByUpdatedAt(g.find({"type": "/type/document"})),
        isMember: res.isMember,
        transloadit_params: config.transloadit.network_cover
      });
    },
    error: function(err) {
      callback(err);
    }
  });
}

function loadCollaborationConfirmation (tan, callback) {
  graph.fetch({"type": "/type/collaborator", "tan": tan, "document": {}}, function(err, nodes) {
    if (err) return callback(err);
    callback(null, {
      tan: tan,
      document: nodes.select(function(n) {
        return n.types().get('/type/document');
      }).first(),
      collaborator: nodes.select(function(n) {
        return n.types().get('/type/collaborator');
      }).first()
    });
  });
}

function search (searchstr, callback) {
  $.ajax({
    type: 'GET',
    url: '/fulltextsearch?q=' + encodeURI(searchstr),
    dataType: 'json',
    success: function (res) {
      callback(null, res);
    },
    error: function (err) {
      callback(err, null);
    }
  });
}


function documentURL(doc) {
  return "" + doc.get('creator')._id.split("/")[2] + "/" + doc.get('name');
}

function userName(user) {
  return user._id.split('/')[2];
}

function deleteDocument (doc, callback) {
  graph.del(doc._id);
  setTimeout(function () {
    callback(null);
  }, 300);
  notifier.notify(Notifications.DOCUMENT_DELETED); // TODO
}

function byCreatedAt (item1, item2) {
  var v1 = item1.value.get('created_at')
  ,   v2 = item2.value.get('created_at');
  return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
}

function checkDocumentName (name, callback) {
  if (new RegExp(graph.get('/type/document').get('properties', 'name').validator).test(name)) {
    // TODO: find a more efficient way to check for existing docs.
    $.ajax({
      type: "GET",
      url: "/documents/"+app.username+"/"+name,
      dataType: "json",
      success: function(res) {
        callback(res.status === 'error');
      },
      error: function(err) {
        callback(true); // Not found. Fine.
      }
    });
  } else {
    callback(false);
  }
}

function updateDocumentName (doc, name, callback) {
  checkDocumentName(name, function (valid) {
    if (valid) {
      doc.set({ name: name });
      callback(null);
    } else {
      callback(new Error("Sorry, this name is already taken."));
    }
  });
}

function subscribeDocument (doc, callback) {
  graph.set(null, {
    type: '/type/subscription',
    user: '/user/'+app.username,
    document: doc._id
  });
  
  doc.set({
    subscribed: true,
    subscribers: doc.get('subscribers') + 1
  });
  doc._dirty = false;
  
  setTimeout(function () {
    callback(null);
  }, 300);
}

function unsubscribeDocument (doc, callback) {
  graph.fetch({
    type: '/type/subscription',
    user: '/user/'+app.username,
    document: doc._id
  }, function (err, nodes) {
    graph.del(nodes.first()._id);
    doc.set({
      subscribed: false,
      subscribers: doc.get('subscribers') - 1
    });
    doc._dirty = false;
    
    callback(err);
  });
}

function loadSubscribers (doc, callback) {
  graph.fetch({"type": "/type/subscription", "document": doc._id}, function(err, subscriptions) {
    if (err) return callback(err, null);
    callback(err, {subscriptions: subscriptions});
  });
}


function loadVersions (doc, callback) {
  graph.fetch({ "type": "/type/version", "document": doc._id }, function (err, versions) {
    if (err) return callback(err, null);
    callback(null, {
      versions: versions.sort(byCreatedAt)
    });
  });
}


function loadPublish (doc, callback) {
  graph.fetch({ type: '/type/network' }, function (err, availableNetworks) {
    if (err) return callback(err, null);

    graph.fetch({type: '/type/publication', document: doc._id}, function(err, publications) {
      if (err) return callback(err, null);
      var networks = new Data.Hash();
      publications.each(function(pub) {
        var networkId = pub.get('network')._id;
        networks.set(networkId, availableNetworks.get(networkId));
      });

      callback(null, {
        availableNetworks: availableNetworks,
        networks: networks,
        document: doc
      });
    });
  });
}

function publishDocument (doc, networks, remark, callback) {
  $.ajax({
    type: 'POST',
    url: '/publish',
    data: JSON.stringify({
      document: doc._id,
      networks: networks,
      remark: remark
    }),
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      if (res.error) {
        callback(res.error, null);
      } else {
        graph.merge(res.graph);
        callback(null, res);
      }
    },
    error: function (err) {
      callback(err, null);
    }
  });
}

function unpublishDocument (doc, callback) {
  $.ajax({
    type: 'POST',
    url: '/unpublish',
    data: JSON.stringify({
      document: doc._id
    }),
    contentType: 'application/json',
    dataType: 'json',
    success: function (res) {
      if (res.error) {
        callback(res.error, null);
      } else {
        graph.merge(res.graph);
        callback(null, res);
      }
    },
    error: function (err) {
      callback(err, null);
    }
  });
}

function removeVersion(document, version, callback) {
    window.pendingSync = true;
    graph.del(version);
    
    // Trigger immediate sync
    graph.sync(function (err) {
      window.pendingSync = false;
      callback(null);
    });
}

// Network
// ========

function networkSlug (network) {
  return network._id.split('/')[2];
}

function joinNetwork (network, callback) {
  $.ajax({
    type: "POST",
    url: "/network/"+network+"/join",
    dataType: "json",
    success: function (res) {
      callback(null);
    },
    error: function (err) {
      callback(err);
    }
  });
}


function leaveNetwork (network, callback) {
  $.ajax({
    type: "PUT",
    url: "/network/"+network+"/leave",
    dataType: "json",
    success: function (res) {
      callback(null);
    },
    error: function (err) {
      callback(err);
    }
  });
}

// User
// ====

function login (username, password, callback) {
  $.ajax({
    type: "POST",
    url: "/login",
    data: {
      username: username,
      password: password
    },
    dataType: "json",
    success: function (res) {
      if (res.status === 'error') {
        callback({ error: "authentication_failed" }, null);
      } else {
        graph.merge(res.seed);
        app.username = res.username; // TODO
        callback(null, res.username);
      }
    },
    error: function (err) {
      callback({ error: "authentication_failed" }, null);
    }
  });
}

function logout (callback) {
  $.ajax({
    type: "POST",
    url: "/logout",
    dataType: "json",
    success: function (res) {
      callback(null);
    },
    error: function (err) {
      callback(err);
    }
  });
}

function createUser (username, name, email, password, callback) {
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
    success: function (res) {
      res.status === 'error' ? callback('error', res) : callback(null, res);
    },
    error: function (err) {
      console.log("Unknown error. Couldn't create user.")
      //callback(err);
    }
  });
}

function requestPasswordReset (username, callback) {
  $.ajax({
    type: 'POST',
    url: '/recover_password',
    data: {
      username: username
    },
    dataType: 'json',
    success: function (res) {
      if (res.error) {
        callback(res.error, null);
      } else {
        callback(null, res);
      }
    },
    error: function (err) {
      callback(err, null);
    }
  });
}

function resetPassword (username, tan, password, callback) {
  $.ajax({
    type: 'POST',
    url: '/reset_password',
    data: {
      username: username,
      tan: tan,
      password: password
    },
    dataType: 'json',
    success: function (res) {
      if (res.status === 'error') {
        callback(res.message, null);
      } else {
        callback(null, res);
      }
    },
    error: function (err) {
      callback(err, null);
    }
  });
}

function getPublishState(doc) {
  if (!doc.get('published_version')) {
    return "unpublished";
  } else if (doc.get('published_on') === doc.get('updated_at')) {
    return "published";
  } else {
    return "published-outdated";
  }
}

function loggedIn () {
  return !!(app || session).username;
}

function currentUser () {
  return graph.get('/user/'+session.username);
}

function isCurrentUser (user) {
  return (app || session).username === user._id.split('/')[2];
}


// Collaboration
// -------------

function invite (email, doc, mode, callback) {
  $.ajax({
    type: 'POST',
    url: '/invite',
    data: {
      email: email,
      document: doc._id,
      mode: mode
    },
    dataType: 'json',
    success: function (res) {
      if (res.error) {
        callback(res.error);
      } else {
        callback(null);
      }
    },
    error: function (err) {
      callback(err);
    }
  });
}

function getCollaborators (doc, callback) {
  graph.fetch({
    type: '/type/collaborator',
    document: doc._id
  }, function (err, nodes) {
    callback(err, nodes);
  });
}

function removeCollaborator (collaboratorId, callback) {
  window.pendingSync = true;
  graph.del(collaboratorId);
  
  // trigger immediate sync
  graph.sync(function (err) {
    window.pendingSync = false;
    //that.collaborators.del(collaboratorId);
    callback(err);
  });
}

function changeCollaboratorMode (collaboratorId, mode, callback) {
  window.pendingSync = true;
  
  graph.get(collaboratorId).set({
    mode: mode
  });
  
  // trigger immediate sync
  graph.sync(function (err) {
    window.pendingSync = false;
    callback(err);
  });
}


// Notifications
// =============

function getNotifications () {
  var username = session.username;
  var notifications = graph.find({"type|=": "/type/notification", "recipient": "/user/"+username});

  var SORT_BY_DATE_DESC = function(v1, v2) {
    var v1 = v1.value.get('created_at'),
        v2 = v2.value.get('created_at');
    return v1 === v2 ? 0 : (v1 > v2 ? -1 : 1);
  }
  
  return notifications.sort(SORT_BY_DATE_DESC);
}

function loadNotifications (callback) {
  $.ajax({
    type: "GET",
    url: "/notifications",
    dataType: "json",
    success: function (notifications) {
      var newNodes = {};
      _.each(notifications, function (n, key) {
        // Only merge in if not already there
        if (!graph.get(key)) {
          newNodes[key] = n;
        }
      });
      graph.merge(newNodes);
      callback(null);
    }
  });
}


// Import
// ======

function importFromPandoc (doc, pandoc) {
  // Pandoc's JSON representation is derived from it's Haskell data types at
  // https://github.com/jgm/pandoc-types/blob/master/Text/Pandoc/Definition.hs
  // I've summarized the rules here: http://substance.io/timbaumann/letterpress
  
  var stack    = [doc]
  ,   textNode = null;
  
  function dispatch (obj, funs) {
    if (typeof obj === 'string') {
      return funs[obj]();
    } else {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) { break; }
      }
      return funs[key](obj[key]);
    }
  }
  
  function appendNode (node) {
    var parent = stack[stack.length-1]
    ,   children = parent.all('children');
    children.set(node._id, node, children.length);
  }
  
  function startTextNode () {
    if (!textNode) {
      textNode = graph.set(null, {
        type: '/type/text',
        content: ' ',
        document: doc._id
      });
      appendNode(textNode);
    }
  }
  
  function appendText (html) {
    textNode.set({
      content: textNode.get('content') + html
    });
  }
  
  function endTextNode () {
    textNode = null;
  }
  
  function wrapWith (tagName) {
    return function (s) {
      return '<' + tagName + '>' + inlinesToHtml(s) + '</' + tagName + '>';
    };
  }
  
  function ret (v) {
    return function () { return v; };
  }
  
  var inlineToHtml = {
    Str: function (s) { return s; },
    Emph: wrapWith('em'),
    Strong: wrapWith('strong'),
    Strikeout: inlinesToHtml,
    Superscript: inlinesToHtml,
    Subscript: inlinesToHtml,
    SmallCaps: inlinesToHtml,
    Quoted: function (a) { return inlinesToHtml(a[1]); },
    Cite: function (a) { return inlinesToHtml(a[1]); },
    Code: function (a) { return '<code>' + a[1] + '</code>'; },
    Space: ret(" "),
    EmDash: ret("—"),
    EnDash: ret("–"),
    Apostrophe: ret("’"),
    Ellipses: ret("…"),
    LineBreak: ret("<br />"),
    Math: ret(" <em>Inline Math is not supported yet.</em> "),
    RawInline: ret(""),
    Link: function (a) { return '<a href="' + a[1][0] + '">' + inlinesToHtml(a[0]) + '</a>'; },
    Image: ret(" <em>Inline Images are not supported yet.</em> "),
    Note: ret(" <em>Footnotes are not supported yet.</em> ")
  };
  
  function inlinesToHtml (inlines) {
    var html = '';
    for (var i = 0, l = inlines.length; i < l; i++) {
      html += dispatch(inlines[i], inlineToHtml);
    }
    return html;
  }
  
  function stripHtml (html) {
    return html.replace(/<[^>]*>/g, '');
  }
  
  function inlinesToText (inlines) {
    return stripHtml(inlinesToHtml(inlines));
  }
  
  var importBlock = {
    Plain: function (inlines) {
      this.Para(inlines);
    },
    Para: function (inlines) {
      function isWhitespace (a) { return ['Space', 'LineBreak'].indexOf(a) >= 0; }
      function trimLeft () { while (isWhitespace(inlines[0])) { inlines.shift(); } }
      
      trimLeft();
      while (_.keys(inlines[0])[0] === 'Image') {
        var a = inlines[0].Image
        ,   url = a[1][0]
        ,   caption = url[0];
        
        endTextNode();
        var image = graph.set(null, {
          type: '/type/image',
          url: url,
          caption: inlinesToText(caption),
          document: doc._id
        });
        
        trimLeft();
      }
      
      if (inlines.length) {
        startTextNode();
        appendText('<p>' + inlinesToHtml(inlines) + '</p>');
      }
    },
    CodeBlock: function (a) {
      endTextNode();
      
      var classes = a[0][1];
      var languages = [ 'javascript', 'python', 'ruby', 'php', 'html', 'css'
                      , 'haskell', 'coffeescript', 'java', 'c'
                      ]
      var language = 'null';
      _.each(classes, function (klass) {
        klass = klass.toLowerCase();
        if (languages.indexOf(klass) >= 0) { language = klass; }
      });
      
      var code = graph.set(null, {
        type: '/type/code',
        language: language,
        content: s.util.escape(a[1]),
        document: doc._id
      });
      appendNode(code);
    },
    RawBlock: function () {
      endTextNode();
      // do nothing
    },
    BlockQuote: function (a) {
      endTextNode();
      var quote = graph.set(null, {
        type: '/type/quote',
        content: blocksToText(a),
        author: "",
        document: doc._id
      });
      appendNode(quote);
    },
    OrderedList: function (a) {
      startTextNode();
      appendText(blockToHtml.OrderedList(a));
    },
    BulletList: function (a) {
      startTextNode();
      appendText(blockToHtml.BulletList(a));
    },
    DefinitionList: function (a) {
      _.each(a, function (pair) {
        startTextNode();
        appendText('<p><strong>' + inlinesToHtml(pair[0]) + '</strong></p>');
        _.each(pair[1], importBlocks);
      });
    },
    Header: function (a) {
      endTextNode();
      
      var level = a[0]
      ,   name  = a[1];
      
      var section = graph.set(null, {
        type: '/type/section',
        document: doc._id,
        name: inlinesToText(name)
      });
      
      while (stack.length > level) { stack.pop(); }
      appendNode(section);
      stack.push(section);
    },
    HorizontalRule: function () {
      endTextNode();
      // do nothing
    },
    Table: function () {
      endTextNode();
      // TODO: implement when tables are supported
    },
    Null: function () {
      endTextNode();
    }
  };
  
  var blockToHtml = {
    Plain: function (inlines) {
      return this.Para(inlines);
    },
    Para: function (inlines) {
      return inlinesToHtml(inlines);
    },
    CodeBlock: ret(''),
    RawBlock: ret(''),
    BlockQuote: ret(''),
    OrderedList: function (a) {
      function li (b) { return '<li>' + blocksToHtml(b) + '</li>'; }
      return '<ol>' + _.map(a[1], li).join('') + '</ol>';
    },
    BulletList: function (a) {
      function li (b) { return '<li>' + blocksToHtml(b) + '</li>'; }
      return '<ul>' + _.map(a, li).join('') + '</ul>';
    },
    DefinitionList: ret(''),
    Header: function (a) {
      return '<strong>' + inlinesToHtml(a[1]) + '</strong>';
    },
    HorizontalRule: ret(''),
    Table: ret(''),
    Null: ret('')
  };
  
  function blocksToHtml (blocks) {
    var html = '';
    for (var i = 0, l = blocks.length; i < l; i++) {
      html += dispatch(blocks[i], blockToHtml);
    }
    return html;
  }
  
  function blocksToText (blocks) {
    return stripHtml(blocksToHtml(blocks));
  }
  
  function importBlocks (blocks) {
    for (var i = 0, l = blocks.length; i < l; i++) {
      dispatch(blocks[i], importBlock);
    }
  }
  
  importBlocks(pandoc[1]);
}

function importFromText (doc, format, text, callback) {
  $.ajax({
    type: 'POST',
    url: '/parse',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify({
      format: format,
      text: text
    }),
    success: function (pandocJson) {
      try {
        importFromPandoc(doc, pandocJson);
      } catch (exc) {
        callback(exc);
        return;
      }
      callback();
    },
    error: function (err) {
      callback(err);
    }
  });
}

// The Router
// ---------------

s.Router = Backbone.Router.extend({
  initialize: function() {

    // Using this.route, because order matters
    this.route(":username", "user", app.user);
    
    this.route(":username/:docname/:p1/:p2/:p3", "node", this.loadDocument);
    this.route(":username/:docname/:p1/:p2", "node", this.loadDocument);
    this.route(":username/:docname/:p1", "node", this.loadDocument);
    this.route(":username/:docname", "node", this.loadDocument);
    
    this.route("reset/:username/:tan", "reset", app.resetPassword);
    this.route("subscribed", "subscribed", app.subscribedDocs);
    this.route("recent", "recent", app.recentDocs);
    this.route("collaborate/:tan", "collaborate", app.collaborate);
    this.route("search/:searchstr", "search", app.searchDocs);
    this.route("register", "register", app.register);
    this.route("recover", "recover", app.recoverPassword);
    this.route("new", "new", app.newDocument);
    this.route("import", "import", app["import"]);
    
    this.route("settings", "settings", app.userSettings);
    this.route("dashboard", "dashboard", app.dashboard);
    this.route("explore", "explore", app.explore);
    this.route("network/:network", "network", app.network);
    this.route("search", "search", app.search);
    
    this.route("", "home", this.landingPage);
  },

  landingPage: function() {
    session && session.username ? app.dashboard() : app.home();
  },

  loadDocument: function(username, docname, p1, p2, p3) {
    var version = !p1 || p1.indexOf("_") >= 0 ? null : p1;
    var node = version ? p2 : p1;
    var comment = version ? p3 : p2;
    
    app.loadDocument(username, docname, version, node, comment);
  }
});

var StateMachine = {
  transitionTo: function (state) {
    if (this.state !== state && this.invokeForState('leave', state) !== false) {
      this.state = state;
      this.invokeForState('enter');
    }
  },

  invokeForState: function (method) {
    var args = Array.prototype.slice.call(arguments, 1);
    
    var parent = this;
    while (parent) {
      var constructor = parent.constructor;
      if (constructor.states &&
          constructor.states[this.state] &&
          constructor.states[this.state][method]) {
        return constructor.states[this.state][method].apply(this, args);
      }
      // Inheritance is set up by Backbone's extend method
      parent = constructor.__super__;
    }
  }
};

s.views.UserStatus = Backbone.View.extend(_.extend({}, StateMachine, {

  id: 'user_status',

  events: {
    'click .logout': 'logout',
    'submit #login-form': 'login',
    
    'click .toggle.notifications': 'toggleNotifications',
    'click #event_notifications a .notification': 'hideNotifications',
    'click a.open-notification': 'openNotification'
  },

  openNotification: function(e) {
    var url = $(e.currentTarget).attr('href');
    var p = url.replace('#', '/').split('/');
    var user = p[1];
    var doc = p[2];

    var version = !p[3] || p[3].indexOf("_") >= 0 ? null : p[3];
    var node = version ? p[4] : p[3];
    var comment = version ? p[5] : p[4];
    
    app.loadDocument(user, doc, version, node, comment);
    router.navigate(url);
    return false;
  },

  initialize: function () {
    this.notificationsActive = false;
    this.state = session.username ? 'logged_in' : 'logged_out';
    
    setInterval(function() {
      loadNotifications(function () {});
    }, 30000);
  },

  transitionTo: function () {
    var r = StateMachine.transitionTo.apply(this, arguments);
    this.render();
    return r;
  },

  render: function () {
    $(this.el).html(this.invokeForState('render'));
    return this;
  },

  login: function (e) {
    var username = this.$('#login-user').val()
    ,   password = this.$('#login-password').val();
    
    login(username, password, function (err) {
      if (err) return notifier.notify(Notifications.AUTHENTICATION_FAILED);
      window.location.reload();
    });
    
    return false;
  },

  logout: function (e) {
    logout(_.bind(function (err) {
      if (!err) {
        window.location.reload();
      }
    }, this));
    
    return false;
  },

  // Triggered by toggleNotifications
  // Triggers markAllRead
  showNotifications: function() {
    $(this.el).addClass('notifications-active');
    this.notificationsActive = true;
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
    
    $(this.el).removeClass('notifications-active');
    this.notificationsActive = false;
  },
  
  toggleNotifications: function (e) {
    if (this.notificationsActive) {
      this.hideNotifications();
    } else {
      this.showNotifications();
    }
    return false;
  }

}), {

  states: {
    logged_in: {
      render: function () {
        var notifications = getNotifications();
        
        return s.util.tpl('user_navigation', {
          notifications: notifications,
          user: currentUser(),
          count: notifications.select(function(n) { return !n.get('read')}).length,
          notifications_active: true
        });
      }
    },

    logged_out: {
      render: function () { return s.util.tpl('login_form'); }
    }
  }

});

s.views.Home = Backbone.View.extend({

  events: {
    'click .watch-intro': 'watchIntro'
  },

  watchIntro: function() {
    $('#startpage .intro').height('400');
    $('#startpage .intro .intro-text').fadeOut();
    setTimeout(function() {
      $('#startpage .intro .video').html('<video autoplay width="920" height="400" controls><source src="http://substance.io/videos/substance_intro.mp4" type=\'video/mp4; codecs="avc1.42E01E, mp4a.40.2"\'><source src="http://substance.io/videos/substance_intro.ogv" type="video/ogg" /> </video>')
      setTimeout(function() {
        $("video").unbind();
        $("video").bind("ended", function() {
          $('#startpage .video-credits').fadeIn(1000);
        });
        $("video").bind("seeking", function() {
          $('#startpage .video-credits').fadeOut();
        });
        $('#startpage .intro .video').fadeIn();
      }, 400);
    }, 1000);
    
    return false;
  },

  render: function () {
    $(this.el).html(s.util.tpl('home', {}));
    
    // Load Flattr
    (function () {
      var s = document.createElement('script'), t = document.getElementsByTagName('script')[0];
      s.type = 'text/javascript';
      s.async = true;
      s.src = 'http://api.flattr.com/js/0.6/load.js?mode=auto';
      t.parentNode.insertBefore(s, t);
    })();
    
    return this;
  }

});

s.views.Results = Backbone.View.extend({

  render: function() {
    $(this.el).html(s.util.tpl('results', this.model));
    return this;
  }
});

s.views.UserList = Backbone.View.extend({
  className: "user-list",

  initialize: function(options) {
  },

  render: function() {
    $(this.el).html(s.util.tpl('user_list', {
      users: this.model.members
    }));
    return this;
  }
});
s.views.Signup = Backbone.View.extend({

  id: 'signup',
  className: 'page-content',

  events: {
    'submit form': 'registerUser'
  },

  render: function () {
    $(this.el).html(s.util.tpl('signup', {}));
    return this;
  },

  registerUser: function (e) {
    $('.page-content .input-message').empty();
    $('#registration_error_message').empty();
    $('.page-content input').removeClass('error');
    
    var user     = this.$('#signup_user').val()
    ,   name     = this.$('#signup_name').val()
    ,   email    = this.$('#signup_email').val()
    ,   password = this.$('#signup_password').val();
    
    createUser(user, name, email, password, function (err, res) {
      if (err) {
        if (res.field === "username") {
          $('#signup_user').addClass('error');
          $('#signup_user_message').html(res.message);
        } else {
          $('#registration_error_message').html(res.message);
        }
      } else {
        notifier.notify(Notifications.AUTHENTICATED);
        window.location.href = "/"+res.username;
      }
    });
    return false;
  }
});

s.views.Dashboard = Backbone.View.extend({

  events: {
    'click .toggle-bin': '__toggleBin'
  },

  __toggleBin: function(e) {
    this.activeCategory = $(e.currentTarget).attr('data-category');
    this.activeBin = $(e.currentTarget).attr('data-bin');
    this.updateResults();
    this.render();
  },

  updateResults: function() {
    var docs = this.model.documents.select(_.bind(function(d) {
      return _.include(this.model.bins[this.activeCategory][this.activeBin].documents, d._id);
    }, this));

    this.results = new s.views.Results({ model: {documents: docs }, id: "results" });
  },

  initialize: function(options) {
    this.activeCategory = "user";
    this.activeBin = "user";
    this.updateResults();
  },

  render: function() {
    $(this.el).html(s.util.tpl('dashboard', {
      user: this.model.user,
      bins: this.model.bins,
      activeBin: this.activeBin
    }));
    
    this.$(this.results.render().el).appendTo(this.el);
    return this;
  }
});
s.views.UserProfile = Backbone.View.extend({

  events: {
    
  },

  initialize: function(options) {
    this.results = new s.views.Results({ model: this.model, id: "results" });
  },

  render: function() {
    $(this.el).html(s.util.tpl('user_profile', {
      user: this.model.user
    }));
    
    this.$(this.results.render().el).appendTo(this.el);
    return this;
  }

});

s.views.Explore = Backbone.View.extend({

  render: function() {
    $(this.el).html(s.util.tpl('explore', this.model));
    return this;
  }

});

s.views.Import = Backbone.View.extend({

  id: 'import',
  className: 'page-content',

  events: {
    'submit form': 'importDocument'
  },

  render: function () {    
    $(this.el).html(s.util.tpl('import', {}));
    setTimeout(function () {
      var cm = CodeMirror.fromTextArea(this.$('textarea').get(0), {
        lineNumbers: true,
        theme: 'elegant'
      });
      cm.focus();
    }, 10);
    return this;
  },
  
  importDocument: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var type = '/type/article' // $('#create_document select[name=document_type]').val()
    ,   title = this.$('#new_document_name').val()
    ,   format = this.$('#format').val()
    ,   text = this.$('#text').val()
    ,   name = s.util.slug(title);
    
    checkDocumentName(name, _.bind(function (valid) {
      if (valid) {
        notifier.notify(Notifications.BLANK_DOCUMENT);
        var doc = createDoc(type, name, title);
        importFromText(doc, format, text, function (err) {
          if (err) { console.error(err); }
          graph.sync(function (err) {
            router.navigate(documentURL(doc), true);
          });
        });
      } else {
        this.$('#new_document_name').addClass('error');
        this.$('#new_document_name_message').html("This document name is already taken.");
      }
    }, this));
  }
});

s.views.Network = Backbone.View.extend({

  events: {
    'click .join-network': '__joinNetwork',
    'click .leave-network': '__leaveNetwork',
    'click .toggle-documents': '__toggleDocuments',
    'click .toggle-members': '__toggleMembers',
    'change .image-file': '__upload'
  },

  __joinNetwork: function() {
    joinNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.reload();
    }, this));
    return false;
  },

  __leaveNetwork: function() {
    leaveNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.reload();
    }, this));
    return false;
  },

  __toggleDocuments: function() {
    this.mode = 'documents';
    this.reload();
  },

  __toggleMembers: function() {
    this.mode = 'members';    
    this.reload();
  },

  __upload: function() {
    this.$('.upload-image-form').submit();
  },

  initializeUploadForm: function () {
    _.bindAll(this, 'onStart', 'onProgress', 'onError');

    this.$('.upload-image-form').transloadit({
      modal: false,
      wait: true,
      autoSubmit: false,
      onStart: this.onStart,
      onProgress: this.onProgress,
      onError: this.onError,
      onSuccess: _.bind(function (assembly) {
        if (assembly.results.web_version &&
            assembly.results.web_version[1] &&
            assembly.results.web_version[1].url) {
          this.onSuccess(assembly);
        } else {
          this.onInvalid();
        }
      }, this)
    });
  },

  makeEditable: function() {
    var that = this;
    
    // Editor for network name
    this.$name = $('#network_header .title').unbind();
    
    this.$name.click(function() {
      editor.activate(that.$name, {
        placeholder: 'Enter Title',
        markup: false,
        multiline: false
      });

      editor.bind('changed', function() {
        that.model.network.set({
          name: editor.content()
        });
      });
    });

    // Editor for network description
    this.$descr = $('#network_header .descr').unbind();
    
    this.$descr.click(function() {
      editor.activate(that.$descr, {
        placeholder: 'Enter Sheet Description',
        controlsTarget: $('#sheet_editor_controls')
      });

      editor.bind('changed', function() {
        that.model.network.set({
          descr: editor.content()
        });
      });
    });
    this.initializeUploadForm();
  },

  onStart: function () {
    this.$('.image-progress').show();
    this.$('.image-progress .label').html("Uploading &hellip;");
    this.$('.progress-bar').css('width', '0%');
  },

  onProgress: function (bytesReceived, bytesExpected) {
    var percentage = Math.max(0, parseInt(bytesReceived / bytesExpected * 100));
    if (!percentage) percentage = 0;
    this.$('.image-progress .label').html("Uploading &hellip; " + percentage + "%");
    this.$('.progress-bar').css('width', percentage + '%');
  },

  onSuccess: function (assembly) {
    this.model.network.set({
      cover: assembly.results.web_version[1].url
    });
    
    this.$('.image-progress').hide();
    $('.upload-image-form img').attr('src', assembly.results.web_version[1].url);
  },

  onError: function (assembly) {
    // TODO
  },

  onInvalid: function () {
    this.$('.image-progress .label').html("Invalid image. Skipping &hellip;");
    this.$('.image-progress').hide();
    
    setTimeout(_.bind(function () {
      this.$('.info').show();
    }, this), 3000);
  },

  initialize: function(options) {
    this.documents = new s.views.Results({ model: this.model, id: "results" });
    this.members = new s.views.UserList({model: this.model, id: "members"});
    this.mode = "documents";
    _.bindAll(this, 'makeEditable');
  },

  reload: function() {
    loadNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.model = data;
      this.documents = new s.views.Results({ model: this.model, id: "results" });
      this.members = new s.views.UserList({model: this.model, id: "members"});
      this.render();
    }, this));
  },

  render: function() {
    $(this.el).html(s.util.tpl('network', _.extend(this.model, {mode: this.mode})));
    this.$(this[this.mode].render().el).appendTo(this.el);
    
    if (isCurrentUser(this.model.network.get('creator'))) {
      // TODO: do it properly
      setTimeout(this.makeEditable, 500);
    }
    return this;
  }
});

s.views.Search = Backbone.View.extend({
  id: 'search',
  
  events: {
    'submit form': 'performSearch'
  },
  
  render: function() {
    $(this.el).html(s.util.tpl('search'));
    return this;
  },
  
  performSearch: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var searchstr = this.$('#search_string').val();
    
    search(searchstr, _.bind(function (err, res) {
      if (err) { console.log(err); return; }
      
      console.log(err, res);
      
      this.$('#results').html(s.util.tpl('search_results', {
        users: res.users,
        documents: res.documents
      }));
    }, this));
  }
});

s.views.UserSettings = Backbone.View.extend({
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

            router.navigate(app.username, true);
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
    $(this.el).html(s.util.tpl('user_settings', {
      user: graph.get('/user/'+app.username)
    }));
    return this;
  }
});

s.views.NewDocument = Backbone.View.extend({

  id: 'new_document',
  className: 'page-content',

  events: {
    'submit form': 'createDocument'
  },

  render: function () {    
    $(this.el).html(s.util.tpl('new_document', {}));
    return this;
  },
  
  createDocument: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var type = '/type/article' // $('#create_document select[name=document_type]').val()
    ,   title = this.$('#new_document_name').val()
    ,   name = s.util.slug(title);
    
    checkDocumentName(name, _.bind(function (valid) {
      if (valid) {
        notifier.notify(Notifications.BLANK_DOCUMENT);
        var doc = createDoc(type, name, title);
        graph.sync(function (err) {
          router.navigate(documentURL(doc), true);
        });
      } else {
        this.$('#new_document_name').addClass('error');
        this.$('#new_document_name_message').html("This document name is already taken.");
      }
    }, this));
  }
});

s.views.Header = Backbone.View.extend({

  id: 'header',

  initialize: function (options) {
    this.userStatus = new s.views.UserStatus({});
  },

  render: function() {
    $(this.el).html(s.util.tpl('header', {
      user: graph.get('/user/' + session.username)
    }));
    $(this.userStatus.render().el).appendTo(this.el);
    
    return this;
  }

});

// This is the top-level piece of UI.
s.views.Application = Backbone.View.extend({

  // Events
  // ------

  events: {
    'click .toggle-view': 'toggleView',
    'click .toggle-startpage': 'home'
  },

  toggleView: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var link  = $(e.currentTarget),
        route = link.attr('href').replace(/^\//, '');
    
    $('.toggle-view.active').removeClass('active');
    link.addClass('active');
    router.navigate(route, true);
  },


  // Initialize
  // ----------

  initialize: function () {
    _.bindAll(this);
    
    // Initialize document
    this.header = new s.views.Header({});
    
    // Cookie-based auto-authentication
    if (session.username) {
      graph.merge(session.seed);
      this.username = session.username;
    }
  },

  // Should be rendered just once
  render: function () {
    $(this.header.render().el).prependTo(this.el);
    return this;
  },


  // Helpers
  // -------

  scrollTo: function (id) {
    var offset = $('#'+id).offset();
    // offset ? $('html, body').animate({scrollTop: offset.top-90}, 'fast') : null;
    offset ? $('html, body').scrollTop(offset.top-90) : null;
    return false;
  },

  replaceMainView: function (name, view) {
    $('body').removeClass().addClass('current-view '+name);
    if (this.mainView) {
      this.mainView.remove();
    }
    this.mainView = view;
    $(view.el).appendTo(this.$('#main'));
  },


  // Main Views
  // ----------

  explore: function () {
    loadExplore(_.bind(function (err, res) {
      this.replaceMainView("explore", new s.views.Explore({ model: res, id: 'explore' }).render());
    }, this));
  },

  network: function (network) {
    loadNetwork(network, _.bind(function (err, res) {
      this.replaceMainView("network", new s.views.Network({ model: res, id: 'network' }).render());
    }, this));
  },

  search: function (queryString) {
    search(queryString, _.bind(function (err, res) {
      this.replaceMainView("search", new s.views.Search({ model: res, id: 'search'  }).render());
    }, this));
  },

  home: function () {
    router.navigate('');
    this.replaceMainView("home", new s.views.Home({id: 'home' }).render());
    return false;
  },

  user: function (username) {
    loadUserProfile(username, _.bind(function (err, data) {
      this.replaceMainView("user_profile", new s.views.UserProfile({ model: data, id: 'user_profile' }).render());
    }, this));
  },

  dashboard: function () {
    router.navigate('dashboard');
    loadDashboard({ type: 'user', value: session.username }, _.bind(function (err, data) {
      this.replaceMainView("dashboard", new s.views.Dashboard({ model: data, id: 'dashboard' }).render());
    }, this));
  },

  // Confirm invitation
  collaborate: function(tan) {
    loadCollaborationConfirmation(tan, _.bind(function(err, data) {
      this.replaceMainView("confirm_collaboration", new s.views.ConfirmCollaboration({ model: data, id: 'confirm_collaboration' }).render());
    }, this));
  },

  recoverPassword: function () {
    this.replaceMainView("recover_password", new s.views.RecoverPassword({id: 'recover_password'}).render());
  },

  resetPassword: function (username, tan) {
    this.replaceMainView("reset_password", new s.views.ResetPassword({ username: username, tan: tan, id: 'reset_password' }).render());
  },

  newDocument: function () {
    if (!head.browser.webkit && !head.browser.mozilla) {
      alert("You need to use a Webkit based browser (Google Chrome, Safari) in order to write documents. In future, other browers will be supported too.");
      return false;
    }
    this.replaceMainView("new_document", new s.views.NewDocument({id: 'new_document' }).render());
  },

  register: function () {
    this.replaceMainView("signup", new s.views.Signup({id: 'signup' }).render());
  },

  userSettings: function () {
    this.replaceMainView("user_settings", new s.views.UserSettings({id: 'user_settings' }).render());
  },

  "import": function () {
    this.replaceMainView("import", new s.views.Import({id: 'import' }).render());
  },

  loadDocument: function (username, docname, version, nodeid, commentid) {
    var render = _.bind(function (options) {
      this.replaceMainView("document", new s.views.Document(_.extend(options, {id: 'document_view' })).render());
    }, this);
    
    var id = '/document/'+username+'/'+docname;
    loadDocument(username, docname, version, _.bind(function (err, res) {
      if (err) return $('#main').html('<div class="notification error">'+err.message+'</div>');

      render({
        model: res.doc,
        authorized: res.authorized,
        version: res.version,
        published: res.published
      });

      if (commentid) {
        var node = app.mainView.node.nodes[nodeid.replace(/_/g, "/")];
        node.selectThis();
        node.comments.toggle();
      } else if (nodeid) {
        this.scrollTo(nodeid)
      }
    }, this));
  }

});

s.views.Comments = Backbone.View.extend({

  className: 'comments-wrapper',

  events: {
    'click a.create-comment': 'createComment',
    'click a.remove-comment': 'removeComment',
    'click .comment-content': 'activateEditor'
  },

  initialize: function (options) {
    this.expanded = false;
    this.node = options.node;
  },

  toggle: function () {
    if (this.expanded) {
      this.contract();
    } else {
      this.expand();
    }
  },

  expand: function () {
    $(this.el).addClass('expanded');
    this.expanded = true;
    
    if (!this.comments) {
      this.load(_.bind(function () {
        this.scrollTo();
      }, this));
    } else {
      this.scrollTo();
    }
  },

  contract: function () {
    $(this.el).removeClass('expanded');
    this.expanded = false;
  },

  scrollTo: function () {
    var offset = $(this.el).offset();
    $('html, body').animate({ scrollTop: offset.top - 100 }, 'slow');
  },

  load: function (callback) {
    loadComments(this.model, _.bind(function (err, comments) {
      if (err) { return; }
      this.comments = comments;
      this.render();
      if (callback) { callback(); }
    }, this));
  },


  // Event Handlers
  // --------------

  createComment: function (e) {
    e.preventDefault();
    
    var node = this.model
    ,   content = this.commentEditor.content();
    
    var self = this;
    createComment(node, content, this.node.root.document.version, function () {
      self.load(function () {
        self.render();
      });
    });
  },

  removeComment: function (e) {
    e.preventDefault();
    
    var comment = graph.get($(e.currentTarget).attr('comment'));
    
    var self = this;
    removeComment(comment, function () {
      self.load(function () {
        self.render();
      });
    });
  },

  activateEditor: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var contentEl = this.$('.comment-content');
    this.commentEditor = new Proper();
    this.commentEditor.activate(contentEl, {
      multiline: true,
      markup: true,
      placeholder: "Enter Comment"
    });
  },

  // Render
  // ------

  render: function () {
    var wrapper = $(this.el)
    ,   comments = this.comments;
    
    if (comments) {
      wrapper.html(s.util.tpl('comments', {
        doc: this.model.get('document'),
        node: this.model,
        comments: comments,
        version: this.node.root.document.version
      }));
      
      // Update comment count (TODO)
      //var count = comments && comments.length > 0 ? comments.length : "";
      //$('#'+node.html_id+' > .operations a.toggle-comments span').html(count);
    }
    
    return this;
  }

});

s.views.Controls = Backbone.View.extend(_.extend({}, StateMachine, {

  className: 'controls',

  events: {
    'click .insert a': 'insert',
    'click .move a': 'move'
  },

  initialize: function (options) {
    this.state    = 'read';
    this.root     = options.root;
    this.level    = options.level;
    this.position = options.position;
  },

  transitionTo: function (state) {
    StateMachine.transitionTo.call(this, state);
    this.render();
  },

  getPositionFromEl: function (el) {
    var parentId = el.attr('data-parent')
    ,   afterId = el.attr('data-after');
    
    return new Position(
      graph.get(parentId),
      afterId ? graph.get(afterId) : null
    );
  },

  insert: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var target = $(e.target)
    ,   position = this.getPositionFromEl(target)
    ,   type = target.attr('data-type');
    
    createNode(type, position);
  },

  move: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var target = $(e.target)
    ,   position = this.getPositionFromEl(target);
    
    moveChild(this.root.movedParent, this.root.movedNode, position);
    this.root.transitionTo('write');
  },

  render: function () {
    $(this.el).html(this.invokeForState('render'));
    return this;
  }

}), {

  states: {
    read: {
      render: function () {
        return '';
      }
    },
    write: {
      render: function () {
        var self = this;
        
        var childTypes = new Data.Hash();
        possibleChildTypes(this.position, this.level).each(function (val, type) {
          if (type !== '/type/section' || val.length == 1) {
            childTypes.set(type, _.last(val));
          } else {
            var level = self.level;
            childTypes.set(type, _.map(val, function (position) {
              position.level = level;
              level++;
              return position;
            }));
          }
        });
        
        return s.util.tpl('controls_insert', {
          childTypes: childTypes
        });
      }
    },
    move: {
      render: function () {
        return s.util.tpl('controls_move', {});
      }
    },
    moveTarget: {
      render: function () {
        var movedNode = this.root.movedNode
        ,   level = this.level;
        
        var moveTargets = moveTargetPositions(movedNode, this.position, this.level);
        if (!isSection(movedNode)) {
          moveTargets = [_.last(moveTargets)];
        } else {
          moveTargets = _.map(moveTargets, function (position) {
            position.level = level;
            level++;
            return position;
          });
        }
        
        return s.util.tpl('controls_movetarget', {
          moveTargets: moveTargets
        });
      }
    }
  }

});

s.views.Node = Backbone.View.extend(_.extend({}, StateMachine, {

  className: 'content-node',

  attributes: {
    draggable: 'false'
  },

  initialize: function (options) {
    this.state  = 'read';
    this.parent = options.parent;
    this.level  = options.level;
    this.root   = options.root;

    if (!this.root) {
      this.nodes = {};
      this.root = this;
      this.document = options.document;
    } else {
      this.root.nodes[this.model._id] = this;
    }

    this.comments = new s.views.Comments({ model: this.model, node: this });
    this.afterControls = new s.views.Controls({
      root: this.root,
      level: this.level,
      model: this.parent,
      position: new Position(this.parent, this.model)
    });
    
    $(this.el).attr({ id: this.model.html_id });
    
    _.bindAll(this, 'lastChildChanged');
    this.model.bind('last-child-changed', this.lastChildChanged);
  },

  transitionTo: function (state) {
    StateMachine.transitionTo.call(this, state);
    if (this.state === state) {
      this.afterControls.transitionTo(state);
    }
  },

  lastChildChanged: function () {
    this.afterControls.render();
    
    if (this.parent && isLastChild(this.parent, this.model)) {
      this.parent.trigger('last-child-changed');
    }
  },



  // Events
  // ------

  events: {
    'click .toggle-comments':  'toggleComments',
    'click .remove-node':      'removeNode',
    'click .toggle-move-node': 'toggleMoveNode',
    
    'click': 'selectThis',
    'mouseover': 'highlight',
    'mouseout': 'unhighlight'
  },

  toggleComments: function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.selectThis();
    this.comments.toggle();
  },
  
  removeNode: function (e) {
    e.preventDefault();
    e.stopPropagation();
    removeChild(this.parent, this.model);
  },

  toggleMoveNode: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (this.state === 'move') {
      this.root.transitionTo('write');
    } else {
      // There could be another node that is currently in move state.
      // Transition to read state to make sure that no node is in move state.
      this.root.transitionTo('read');
      this.transitionTo('move');
      
      this.root.movedNode = this.model;
      this.root.movedParent = this.parent;
      this.root.transitionTo('moveTarget');
    }
  },

  selectThis: function (e) {
    // the parent view shouldn't deselect this view when the event bubbles up
    if (e) { e.stopPropagation(); }
    
    if (this.root) {
      this.root.selectNode(this);
    } else {
      this.selectNode(this);
    }
  },

  highlight: function (e) {
    e.preventDefault();
    $(this.el).addClass('active');
  },

  unhighlight: function (e) {
    e.preventDefault();
    $(this.el).removeClass('active');
  },

  select: function (e) {
    $(this.el).addClass('selected');
  },

  deselect: function () {
    $(this.el).removeClass('selected');
  },

  focus: function () {},

  makeEditable: function (el, attr, dflt, options, updateFn) {
    dflt = dflt || '';
    options = _.extend({
      placeholder: dflt,
      markup: false,
      multiline: false,
      codeFontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
    }, options || {});
    updateFn = updateFn || function (node, attr, val, direction) {
      var update = {};
      update[attr] = val;
      update["direction"] = direction;
      updateNode(node, update);
    };
    
    var self = this;
    
    var value = this.model.get(attr);
    if (value) {
      if (options.markup) {
        $(el).html(value);
      } else {
        $(el).text(s.util.unescape(value));
      }
    } else {
      $(el).html('&laquo; '+dflt+' &raquo;').addClass('empty');
    }
    
    $(el)
      .addClass('editable')
      .click(function () {
        if (self.state === 'write') {
          window.editor.activate($(el), options);
          window.editor.bind('changed', function () {
            updateFn(self.model, attr, window.editor.content(), window.editor.direction());
          });
        }
      });
    
    return $(el);
  },

  render: function () {
    this.operationsEl = $(s.util.tpl('operations', {
      commentCount: this.model.get('comment_count') || "",
      authorized: this.root.document.authorized
    })).appendTo(this.el);
    this.contentEl = $('<div class="content"/>').appendTo(this.el);
    if (this.model.get('direction') === "right") this.contentEl.css('direction', 'rtl');
    if (this.comments) this.commentsEl = $(this.comments.render().el).appendTo(this.el);
    return this;
  }

}), {


  // States
  // ------

  states: {
    read: {
      enter: function () {},
      leave: function () {}
    },
    
    write: {
      enter: function () {},
      leave: function () {}
    },

    move: {
      enter: function () {
        $(this.el).addClass('being-moved'); // TODO
      },
      leave: function (nextState) {
        if (nextState === 'moveTarget') { return false; }
        $(this.el).removeClass('being-moved'); // TODO
      }
    },

    moveTarget: {
      enter: function () {},
      leave: function () {}
    }
  },


  // Inheritance & Instantiation
  // ---------------------------

  subclasses: {},

  define: function (types, protoProps, classProps) {
    classProps = classProps || {};
    var subclass = this.extend(protoProps, classProps);
    
    function toArray (a) { return _.isArray(a) ? a : [a] }
    _.each(toArray(types), function (type) {
      this.subclasses[type] = subclass;
    }, this);
    
    return subclass;
  },

  create: function (options) {
    var model = options.model
    ,   type = model.type._id
    ,   Subclass = this.subclasses[type];
    
    if (!Subclass) { throw new Error("Node has no subclass for type '"+type+"'"); }
    return new Subclass(options);
  }

});

s.views.NodeList = Backbone.View.extend({

  className: 'node-list',

  initialize: function (options) {
    this.level = options.level;
    this.root  = options.root;
    
    _.bindAll(this, 'addChild');
    this.model.bind('added-child', this.addChild);
    
    this.firstControls = new s.views.Controls({
      root: this.root,
      model: this.model,
      position: new Position(this.model, null)
    });
    
    var childViews = this.childViews = [];
    this.model.get('children').each(_.bind(function (child) {
      childViews.push(this.createChildView(child));
    }, this));
  },

  remove: function () {
    this.model.unbind('added-child', this.addChild);
    this.eachChildView(function (childView) {
      childView.remove();
    });
    $(this.el).remove();
  },

  eachChildView: function (fn) {
    _.each(this.childViews, fn);
  },

  transitionTo: function (state) {
    function transition (view) { view.transitionTo(state); }
    transition(this.firstControls);
    this.eachChildView(transition);
  },

  addChild: function (child, index) {
    var childView = this.createChildView(child)
    ,   rendered  = this.renderChildView(childView);
    
    this.childViews.splice(index, 0, childView);
    rendered.insertAfter(index === 0 ? this.firstControls.el
                                     : this.childViews[index-1].afterControls.el);
    
    childView.transitionTo('write');
    childView.selectThis();
    childView.focus();
  },

  createChildView: function (child) {
    return s.views.Node.create({
      parent: this.model,
      model: child,
      level: this.level + 1,
      root: this.root
    });
  },

  renderChildView: function (childView) {
    var controls = childView.afterControls;
    var rendered = $([childView.render().el, controls.render().el]);
    
    childView.model.bind('removed', _.bind(function () {
      controls.remove();
      childView.remove();
      // Remove childView from the childViews array
      this.childViews = _.select(this.childViews, function (cv) {
        return cv !== childView;
      });
    }, this));
    return rendered;
  },

  render: function () {
    $(this.firstControls.render().el).appendTo(this.el);
    
    this.eachChildView(_.bind(function (childView) {
      this.renderChildView(childView).appendTo(this.el);
    }, this));
    
    return this;
  }

});

s.views.Node.define('/type/answer', {

  className: 'content-node answer',

  focus: function () {
    this.answerEl.click();
  },

  render: function () {
    s.views.Node.prototype.render.apply(this, arguments);
    this.answerEl = this.makeEditable($('<p class="answer" />'), 'content', "Enter Answer", {
      markup: true,
      multiline: true
    }).appendTo(this.contentEl);
    return this;
  }

});

s.views.Node.define('/type/code', {

  className: 'content-node code',

  events: _.extend({
    'change select': 'changeLanguageSelect'
  }, s.views.Node.prototype.events),

  languages: [ 'JavaScript', 'Python', 'Ruby', 'PHP', 'HTML', 'CSS', 'Haskell'
             , 'CoffeeScript', 'Java', 'C', 'C++', 'C#', 'Other'
             ],

  modeForLanguage: function (language) {
    return {
      javascript: 'javascript',
      python: { name: 'python', version: 3 },
      ruby: 'ruby',
      php: 'php',
      html: 'htmlmixed',
      css: 'css',
      haskell: 'haskell',
      coffeescript: 'coffeescript',
      java: 'text/x-java',
      c: 'text/x-csrc',
      'c++': 'text/x-c++src',
      'c#': 'text/x-csharp'
    }[language] || 'null';
  },

  changeLanguageSelect: function () {
    var newLanguage = this.languageSelect.val();
    updateNode(this.model, { language: newLanguage });
    this.codeMirror.setOption('mode', this.modeForLanguage(newLanguage));
  },

  focus: function () {
    this.codeMirror.focus();
  },

  codeMirrorConfig: {
    lineNumbers: true,
    theme: 'elegant',
    indentUnit: 2,
    indentWithTabs: false,
    tabMode: 'shift'
  },

  render: function () {
    function createSelect (dflt, opts) {
      var html = '<select>';
      _.each(opts, function (lang) {
        var value = lang.toLowerCase();
        selected = dflt === value ? ' selected="selected"' : '';
        html += '<option value="' + value + '"' + selected + '>' + lang + '</option>';
      });
      html += '</select>';
      return html;
    }
    
    var self = this;
    
    s.views.Node.prototype.render.apply(this, arguments);
    this.languageSelect = $(createSelect(this.model.get('language'), this.languages)).appendTo(this.contentEl);
    var codeMirrorConfig = _.extend({}, this.codeMirrorConfig, {
      mode: this.modeForLanguage(this.model.get('language')),
      value: s.util.unescape(this.model.get('content') || ''),
      readOnly: true,
      onFocus: function () {
        // Without this, there is the possibility to focus the editor without
        // activating the code node. Don't ask me why.
        self.selectThis();
      },
      onBlur: function () {
        // Try to prevent multiple selections in multiple CodeMirror instances
        self.codeMirror.setSelection({ line:0, ch:0 }, { line:0, ch:0 });
      },
      onChange: _.throttle(function () {
        updateNode(self.model, { content: s.util.escape(self.codeMirror.getValue()) });
      }, 500)
    });
    this.codeMirror = CodeMirror(this.contentEl.get(0), codeMirrorConfig);
    
    setTimeout(function () {
      // after dom insertion
      self.codeMirror.refresh();
    }, 10);
    
    return this;
  }

}, {

  states: {
    write: {
      enter: function () {
        s.views.Node.states.write.enter.apply(this);
        this.codeMirror.setOption('readOnly', false);
      },
      leave: function () {
        s.views.Node.states.write.leave.apply(this);
        this.codeMirror.setOption('readOnly', true);
      }
    }
  }

});

s.views.Node.define([ '/type/document', '/type/article', '/type/story'
            , '/type/conversation', '/type/manual', '/type/qaa'
            ], {

  className: 'content-node document',

  initialize: function (options) {
    s.views.Node.prototype.initialize.apply(this, arguments);
    delete this.comments;
    delete this.afterControls;
    this.nodeList = new s.views.NodeList({
      model: this.model,
      level: 0,
      root: this
    });
  },

  events: _.extend({
    'mouseover .editable': 'mouseoverEditable'
  }, s.views.Node.prototype.events),

  mouseoverEditable: function (e) {
    var title = this.state === 'write'
              ? "Click to Edit"
              : "";
    $(e.target).attr({ title: title });
  },

  transitionTo: function (state) {
    StateMachine.transitionTo.call(this, state);
    if (this.state === state) {
      this.nodeList.transitionTo(state);
    }
  },

  lastChildChanged: function () {},

  selectNode: function (view) {
    this.deselectNode();
    $(this.el).addClass('something-selected');
    view.select();
    this.selected = view;
  },

  deselectNode: function () {
    if (this.selected) {
      $(this.el).removeClass('something-selected');
      this.selected.deselect();
      delete this.selected;
    }
  },

  render: function () {
    s.views.Node.prototype.render.apply(this, arguments);
    this.$('.content-node-outline').remove();
    this.operationsEl.empty();
    
    var creator     = this.model.get('creator')
    ,   publishedOn = this.model.get('published_on');
    
    this.titleEl     = this.makeEditable($('<div class="document-title" />'), 'title', "Enter Title").appendTo(this.contentEl);
    var authorLink = $('<a class="toggle-view" />')
      .attr({ href: '/'+creator.get('username') })
      .text(creator.get('name') || creator.get('username'));
    this.authorEl    = $('<p class="author" />').append(authorLink).appendTo(this.contentEl);
    this.publishedEl = $('<p class="published" />').text(publishedOn ? s.util.date(publishedOn) : '').appendTo(this.contentEl);
    this.leadEl      = this.makeEditable($('<p class="lead" id="document_lead" />'), 'lead', "Enter Lead").appendTo(this.contentEl);
    $('<div class="document-separator" />').appendTo(this.contentEl);
    this.nodeListEl  = $(this.nodeList.render().el).appendTo(this.contentEl);
    return this;
  }

}, {

  states: {
    write: {
      enter: function () {
        s.views.Node.states.write.enter.apply(this);
        $(this.el).addClass('edit');
      },
      leave: function () {
        s.views.Node.states.write.leave.apply(this);
        $(this.el).removeClass('edit');
        window.editor.deactivate();
      }
    },
    moveTarget: {
      enter: function () {
        $('#document').addClass('move-mode');
      },
      leave: function () {
        delete this.movedNode;
        delete this.movedParent;
        $('#document').removeClass('move-mode');
      }
    }
  }

});

s.views.Node.define('/type/image', {

  className: 'content-node image',

  events: _.extend({
    'change .image-file': 'upload'
  }, s.views.Node.prototype.events),

  focus: function () {
    this.caption.click();
  },

  initializeUploadForm: function () {
    _.bindAll(this, 'onStart', 'onProgress', 'onError');
    
    this.$('.upload-image-form').transloadit({
      modal: false,
      wait: true,
      autoSubmit: false,
      onStart: this.onStart,
      onProgress: this.onProgress,
      onError: this.onError,
      onSuccess: _.bind(function (assembly) {
        if (assembly.results.web_version &&
            assembly.results.web_version[1] &&
            assembly.results.web_version[1].url) {
          this.onSuccess(assembly);
        } else {
          this.onInvalid();
        }
      }, this)
    });
  },

  onStart: function () {
    this.$('.image-progress').show();
    this.$('.info').hide();
    this.$('.image-progress .label').html("Uploading &hellip;");
    this.$('.progress-bar').css('width', '0%');
  },

  onProgress: function (bytesReceived, bytesExpected) {
    var percentage = Math.max(0, parseInt(bytesReceived / bytesExpected * 100));
    if (!percentage) percentage = 0;
    this.$('.image-progress .label').html("Uploading &hellip; " + percentage + "%");
    this.$('.progress-bar').css('width', percentage + '%');
  },

  onSuccess: function (assembly) {
    // This triggers a node re-render
    updateNode(this.model, {
      url: assembly.results.web_version[1].url,
      original_url: assembly.results.print_version[1].url,
      dirty: true
    });
    
    this.$('.progress-container').hide();
    this.$('.info').show();
  },

  onError: function (assembly) {
    // TODO
    //alert(JSON.stringify(assembly));
    //this.$('.image-progress .label').html("Invalid image. Skipping &hellip;");
    //this.$('.progress-container').hide();
    //
    //setTimeout(_.bind(function () {
    //  app.document.reset();
    //  this.$('.info').show();
    //}, this), 3000);
  },

  onInvalid: function () {
    this.$('.image-progress .label').html("Invalid image. Skipping &hellip;");
    this.$('.progress-container').hide();
    
    setTimeout(_.bind(function () {
      this.$('.info').show();
    }, this), 3000);
  },

  upload: function () {
    this.$('.upload-image-form').submit();
  },

  render: function () {
    s.views.Node.prototype.render.apply(this);
    
    this.imageContent = $('<div class="image-content" />').appendTo(this.contentEl);
    if (!this.model.get('url')) { this.imageContent.addClass('placeholder'); }
    
    this.img = $('<img />')
      .attr({ src: this.model.get('url') || '/images/image_placeholder.png' });
    
    $('<a target="_blank" />')
      .attr({ href: this.model.get('original_url') })
      .append(this.img)
      .appendTo(this.imageContent);
    
    this.imageEditor = $(s.util.tpl('image_editor', {
      transloadit_params: config.transloadit.image
    })).appendTo(this.imageContent);
    this.initializeUploadForm();
    
    this.caption = this.makeEditable($('<div class="caption" />'), 'caption', "Enter Caption")
      .insertAfter(this.contentEl);
    
    return this;
  }

}, {

  states: {
    write: {
      enter: function () {
        s.views.Node.states.write.enter.apply(this);
        
        this.img.unwrap();
      },
      leave: function () {
        s.views.Node.states.write.leave.apply(this);
        
        this.img.wrap($('<a target="_blank" />')
          .attr({ href: this.model.get('original_url') }));
      }
    }
  }

});

s.views.Node.define('/type/question', {

  className: 'content-node question',

  focus: function () {
    this.questionEl.click();
  },

  render: function () {
    s.views.Node.prototype.render.apply(this, arguments);
    this.questionEl = this.makeEditable($('<p class="question" />'), 'content', "Enter Question").appendTo(this.contentEl);
    return this;
  }

});

s.views.Node.define('/type/quote', {

  className: 'content-node quote',

  focus: function () {
    this.quoteContentEl.click();
  },

  render: function () {
    s.views.Node.prototype.render.apply(this);
    
    var blockquoteEl = $('<blockquote />').appendTo(this.contentEl);
    this.quoteContentEl = this.makeEditable($('<p class="quote-content" />'), 'content', "Enter Quote")
      .appendTo($('<div />').appendTo(blockquoteEl));
    this.quoteAuthorEl  = this.makeEditable($('<cite class="quote-author" />'), 'author', "Enter Author")
      .appendTo($('<div />').appendTo(blockquoteEl));
    $('<br clear="both" />').appendTo(this.contentEl);
    
    return this;
  }

});

s.views.Node.define('/type/resource', {

  className: 'content-node resource',

  initialize: function () {
    s.views.Node.prototype.initialize.apply(this, arguments);
    this.updateUrl = _.throttle(this.updateUrl, 500);
  },

  focus: function () {
    this.caption.click();
  },

  resourceExists: function (url, callback) {
    var img = new Image();
    img.onload  = function () { callback(true); }
    img.onerror = function () { callback(false); }
    img.src = url;
  },

  updateUrl: function (url) {
    this.resourceExists(url, _.bind(function (doesIt) {
      if (doesIt) {
        console.log("Valid resource: " + url);
        this.img.attr({ src: url });
        this.status.addClass('image').text("Image");
        updateNode(this.model, { url: url });
      } else {
        this.status.prop({ className: 'status' }).text("Invalid URL");
      }
    }, this));
  },

  render: function () {
    s.views.Node.prototype.render.apply(this);
    
    this.resourceContent = $('<div class="resource-content" />').appendTo(this.contentEl);
    if (!this.model.get('url')) { this.resourceContent.addClass('placeholder'); }
    
    this.img = $('<img />')
      .attr({ src: this.model.get('url') || '/images/image_placeholder.png' })
      .appendTo(this.resourceContent);
    
    var resourceEditor = $(s.util.tpl('resource_editor', {})).appendTo(this.contentEl);
    
    this.status = resourceEditor.find('.status');
    
    this.resourceUrl = resourceEditor.find('.resource-url')
      .val(this.model.get('url'))
      .keyup(_.bind(function () {
        this.updateUrl($(this.resourceUrl).val());
      }, this));
    
    this.caption = this.makeEditable($('<div class="caption" />'), 'caption', "Enter Caption")
      .insertAfter(this.contentEl);
    
    return this;
  }

}, {

  states: {
    write: {
      enter: function () {
        s.views.Node.states.write.enter.apply(this);
        this.$('.resource-url').removeAttr('readonly');
      },
      leave: function () {
        s.views.Node.states.write.leave.apply(this);
        this.$('.resource-url').attr({ readonly: 'readonly' });
      }
    }
  }

});

s.views.Node.define('/type/section', {

  className: 'content-node section',

  initialize: function (options) {
    s.views.Node.prototype.initialize.apply(this, arguments);
    this.nodeList = new s.views.NodeList({
      model: this.model,
      level: options.level,
      root: this.root
    });
  },

  focus: function () {
    this.headerEl.click();
  },

  remove: function () {
    this.nodeList.remove();
    $(this.el).remove();
  },

  transitionTo: function (state) {
    s.views.Node.prototype.transitionTo.call(this, state);
    if (this.state === state) {
      this.nodeList.transitionTo(state);
    }
  },

  render: function () {
    s.views.Node.prototype.render.apply(this, arguments);
    var level = Math.min(6, this.level);
    this.headerEl = this.makeEditable($('<h'+level+' />'), 'name', "Enter Section Name").appendTo(this.contentEl);
    this.nodeListEl = $(this.nodeList.render().el).appendTo(this.contentEl);
    return this;
  }

});

s.views.Node.define('/type/text', {

  className: 'content-node text',

  focus: function () {
    $(this.textEl).click();
  },

  select: function () {
    s.views.Node.prototype.select.apply(this);
    this.$('.proper-commands').show();
  },

  deselect: function () {
    s.views.Node.prototype.deselect.apply(this);
    this.$('.proper-commands').hide();
  },

  render: function () {
    s.views.Node.prototype.render.apply(this, arguments);
    this.textEl = this.makeEditable(this.contentEl, 'content', "Enter Text", {
      markup: true,
      multiline: true,
      controlsTarget: $(this.el)
    });
    return this;
  }

});

// The global graph instance
var graph = new Data.Graph(seed, {dirty: false, syncMode: 'push'}).connect('ajax'); // The database

$(function () {
  if (!s.util.browserSupported()) {
    $('#container').html(s.util.tpl('browser_not_supported'));
    $('#container').show();
    return;
  }
  
  // Start the engines
  window.app = new s.views.Application({ el: '#container' }).render();
  
  // Set up a global instance of the Proper Richtext Editor
  window.editor = new Proper();
  
  // Initialize router
  window.router = new s.Router({});
  
  // Start responding to routes
  Backbone.history.start({ pushState: true });
  
  // Prevent exit when there are unsaved changes
  window.onbeforeunload = confirmExit;
  function confirmExit() {
    if (graph.dirtyNodes().length>0) return "You have unsynced changes, which will be lost.";
  }
   
  function resetWorkspace() {
    confirm('There are conflicted or rejected nodes since the last sync. The workspace will be reset for your own safety. Keep in mind we do not yet support simultaneous editing of one document.');
    window.location.reload(true);
  }
  
  window.pendingSync = false;
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

