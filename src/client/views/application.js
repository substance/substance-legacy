// The Router
// ---------------

var Router = Backbone.Router.extend({
  initialize: function() {
    // Using this.route, because order matters
    this.route(":username", "user", app.userDocs);
    
    this.route(":username/:docname/:p1/:p2/:p3", "node", this.loadDocument);
    this.route(":username/:docname/:p1/:p2", "node", this.loadDocument);
    this.route(":username/:docname/:p1", "node", this.loadDocument);
    this.route(":username/:docname", "node", this.loadDocument);
    
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
  
  loadDocument: function(username, docname, p1, p2, p3) {
    var version = !p1 || p1.indexOf("_") >= 0 ? null : p1;
    var node = version ? p2 : p1;
    var comment = version ? p3 : p2;
    app.browser.load({"type": "user", "value": username});
    app.document.loadDocument(username, docname, version, node, comment);
    
    $('#document_wrapper').attr('url', username+'/'+docname+(p1 ? "/"+p1 : "")+(p2 ? "/"+p2 : "")+(p3 ? "/"+p3 : ""));
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
    'click a.toggle-userdocs': 'toggleUserDocs',
    'click a.watch-intro': 'watchIntro'
  },
  
  // Event handlers
  // ---------------
  
  watchIntro: function() {
    $('#startpage .intro').height('400');
    $('#startpage .intro .intro-text').fadeOut();
    setTimeout(function() {
      $('#startpage .intro .video').html('<video autoplay width="920" height="400" controls><source src="http://substance.io/videos/substance_intro.mp4" type=\'video/mp4; codecs="avc1.42E01E, mp4a.40.2"\'><source src="http://substance.io/videos/substance_intro.ogv" type="video/ogg" /> </video>')
      setTimeout(function() {
        $('#startpage .intro .video').fadeIn();
      }, 400);
    }, 1000);
    
    return false;
  },
  
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
    var p = url.replace('#', '/').split('/');
    var user = p[1];
    var doc = p[2];
    
    var version = !p[3] || p[3].indexOf("_") >= 0 ? null : p[3];
    var node = version ? p[4] : p[3];
    var comment = version ? p[5] : p[4];
    
    app.document.loadDocument(user, doc, version, node, comment);
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
    
    $('#document_wrapper').attr('url', user+"/"+name);
    app.document.loadDocument(user, name, null, null, null, 'edit');
    return false;
  },
  
  toggleShowMode: function(e) {
    var user = app.document.model.get('creator')._id.split('/')[2];
    var name = app.document.model.get('name');
    
    $('#document_wrapper').attr('url', user+"/"+name);
    app.document.loadDocument(user, name, null, null, null, 'show');
    return false;
  },
  
  loadDocument: function(e) {
      var user = $(e.currentTarget).attr('user').toLowerCase();
          name = $(e.currentTarget).attr('name');

      app.document.loadDocument(user, name, null,  null, null);
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
        window.location.href = "/"+res.username;
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
      // if (head.browser.ie && head.browser.version > "9.0") {
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
})();