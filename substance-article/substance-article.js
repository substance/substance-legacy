(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var Application = require("./src/application");
Application.View = require("./src/view");
Application.Router = require("./src/router");
Application.Controller = require("./src/controller");
Application.ElementRenderer = require("./src/renderers/element_renderer");
Application.$$ = Application.ElementRenderer.$$;

module.exports = Application;

},{"./src/application":2,"./src/controller":3,"./src/renderers/element_renderer":4,"./src/router":5,"./src/view":6}],2:[function(require,module,exports){
"use strict";

var View = require("./view");
var util = require("substance-util");
// var Controller = require("./controller");
var _ = require("underscore");

// Substance.Application
// ==========================================================================
//
// Application abstraction suggesting strict MVC

var Application = function(config) {
  View.call(this);

  this.config = config;

  this.__controller__ = null;
};

Application.Prototype = function() {

  this.setRouter = function(router) {
    this.router = router;
  };

  // Start Application
  // ----------
  //

  this.start = function(options) {
    options = options || {};
    // First setup the top level view
    if (options.el) {
      this.el = options.el;
      this.$el = $(this.el);
    } else {
      // Defaults to body element
      this.$el = $('body');
      this.el = this.$el[0];
    }

    if (this.initialize) this.initialize();
    this.render();

    // Now the normal app lifecycle can begin
    // Because app state changes require the main view to be present
    // Triggers an initial app state change according to url hash fragment
    if (this.router) this.router.start();
  };

  // Switches the application state
  // --------
  // appState: a list of state objects

  var DEFAULT_SWITCH_OPTIONS = {
    updateRoute: true,
    replace: false
  };

  this.switchState = function(appState, options, cb) {
    var self = this;
    options = _.extend(DEFAULT_SWITCH_OPTIONS, options || {});

    // keep the old state for afterTransition-handler
    var oldAppState = this.getState();

    this.controller.__switchState__(appState, options, function(error) {
      if (error) {
        if (cb) {
          cb(error);
        } else {
          console.error(error.message);
          util.printStackTrace(error);
        }
        return;
      }
      if (options["updateRoute"]) {
        self.updateRoute(options);
      }

      if (self.afterTransition) {
        try {
          self.afterTransition(appState, oldAppState);
        } catch (err) {
          if (cb) {
            cb(err);
          } else {
            console.error(err.message);
            util.printStackTrace(err);
          }
          return;
        }
      }

      if (cb) cb(null);
    });
  };

  this.stateFromFragment = function(fragment) {
    function _createState(stateNames) {
      var state = [];
      for (var i = 0; i < stateNames.length; i++) {
        state.push({id: stateNames[i]});
      }
      return state;
    }

    var state;
    var params = fragment.split(";");

    var i, pair;
    var values = [];
    for (i=0; i<params.length; i++) {
      pair = params[i].split("=");
      var key = pair[0];
      var val = pair[1];
      if (!key || val === undefined) {
        continue;
      }
      if (key === "state") {
        var stateNames = val.split(".");
        state = _createState(stateNames);
      } else {
        pair = key.split(".");
        values.push({state: pair[0], key: pair[1], value: val});
      }
    }

    for (i=0; i<values.length; i++) {
      var item = values[i];
      var data = state[item.state];
      data[item.key] = item.value;
    }

    return state;
  };

  this.getState = function() {
    if (!this.controller.state) return null;

    var appState = [];
    var controller = this.controller;
    while(controller) {
      appState.push(controller.state);
      controller = controller.childController;
    }
    return appState;
  };

  this.updateRoute = function(options) {
    if (!this.router) return;

    options = options || {};

    var appState = this.getState();
    var stateIds = [];
    var stateParams = [];
    for (var i = 0; i < appState.length; i++) {
      var s = appState[i];
      if (!s) continue;
      stateIds.push(s.id);
      for (var key in s) {
        var val = s[key];
        if (key === "id" || key === "__id__" || key === "options") {
          continue;
        }
        // Note: currently only String variables are allowed as state variables
        if (!_.isString(val)) {
          console.error("Only String state variables are allowed");
          continue;
        }
        stateParams.push(i+"."+key+"="+val);
      }
    }
    var stateString = "state="+stateIds.join(".") + ";" + stateParams.join(";");
    this.router.navigate(stateString, {trigger: false, replace: options.replace});
  };

  // Called by a sub controller when a sub-state has been changed
  this.stateChanged = function(controller, oldState, options) {
    if (options["updateRoute"]) {
      this.updateRoute(options);
    }
  };
};

Application.Prototype.prototype = View.prototype;
Application.prototype = new Application.Prototype();

Object.defineProperty(Application.prototype, "controller", {
  set: function(controller) {
    controller.setChangeListener(this);
    this.__controller__ = controller;
  },
  get: function() {
    return this.__controller__;
  }
});

module.exports = Application;

},{"./view":6,"substance-util":127,"underscore":134}],3:[function(require,module,exports){
"use strict";

var util = require("substance-util");
var _ = require("underscore");

// Substance.Application.Controller
// ==========================================================================
//
// Application Controller abstraction suggesting strict MVC

var Controller = function() {

  // an object that has a method 'stateChanged()'
  this.changeListener = null;

  // the state is represented by a unique name
  this.state = null;

  // Each controller can have a single (active) child controller
  this.__childController__ = null;
};

Controller.Prototype = function() {

  // A built-in transition function for switching to an initial state
  // --------
  //

  this.intitialize = function(/*state, cb*/) {};

  // A built-in transition function which is the opposite to `initialize`
  // ----
  this.dispose = function() {
    if (this.__childController__) this.__childController__.dispose();
    this.__childController__ = null;
    this.state = null;
  };

  // State transition
  // ----
  // A typical transition implementation consists of 3 blocks:
  //
  // 1. Reflexive transitions (idem-potent checks):
  //    You have to check if a transition is actually necessary.
  //    If not call `cb(null, skipTransition=true)`
  //
  // 2. Disposal
  //    Clean up anything left from the old state
  //
  // 3. New state
  //    Create anything necessary for the new state
  //
  // Note: to provide additional run-time information you can access
  //       the options with `newState.options`
  //       However, when the state is loaded e.g. from the URL
  //       this information is not available.

  this.transition = function(newState, cb) {
    cb(null);
  };

  this.switchState = function(state, options, cb) {
    if (!cb && _.isFunction(options)) cb = options;
    var self = this;

    if (arguments.length === 1 && _.isFunction(options)) {
      cb = options;
      options = {};
    }

    options = options || {updateRoute: true, replace: false};

    cb = cb || function(err) {
      if (err) {
        console.error("Error during switch state", state, options);
        util.printStackTrace(err);
        throw new Error(err);
      }
    };

    var oldState = this.state;
    this.__switchState__(state, options, function(error) {
      if (error) return cb(error);
      if (self.changeListener) self.changeListener.stateChanged(this, oldState, options);
      cb(null);
    });
  };

  this.__switchState__ = function(appState, options, cb) {
    // console.log("Controller.switchState", JSON.stringify(state));
    var self = this;

    cb = cb || function(err) {
      if (err) throw new Error(err);
    };

    if (!_.isArray(appState)) {
      appState = [appState];
    }

    var _state = appState.shift();

    // Note: adding the options here to allow to provide custom dynamic data.
    //       However, you should use that rarely, as dynamic state information
    //       is not serialized. E.g., when loading the state from URL this information
    //       will not be available.
    _state.options = options;

    var _skipped;

    var _afterTransition = function() {
      if (!_skipped) {
        var oldState = self.state;
        self.state = _state;
        self.afterTransition(oldState);
      }
      cb(null);
    };

    var _transition = function() {
      // console.log("Transition to", _state);
      try {
        self.transition(_state, function(error, skipped) {
          if (error) return cb(error);

          _skipped = skipped;

          // The transition has been done in this level, i.e., child controllers
          // might have been created.
          // If a child controller exists we recurse into the next level.
          // After that the controller gets triggered about the finished transition.

          if (self.childController) {
            if (appState.length > 0) {
              self.childController.__switchState__(appState, options, function(error) {
                if (error) return cb(error);
                _afterTransition();
              });
            }
            else if (self.childController.AUTO_INIT) {
              self.childController.initialize(null, function(error){
                if (error) return cb(error);
                _afterTransition();
              });
            }
            else {
              return cb("Unsufficient state data provided! Child controller needs a transition!");
            }

          } else {
            _afterTransition();
          }
        });
      } catch (err) {
        cb(err);
      }
    };

    // If no transitions are given we still can use dispose/initialize
    // to reach the new state
    if (!this.state) {
      // console.log("Initializing...", _state);
      this.initialize(_state, function(error) {
        if (error) return cb(error);
        self.state = {id: "initialized"};
        _transition();
      });
    } else {
      _transition();
    }
  };

  this.afterTransition = function() {};

  this.setChildController = function(childController) {
    if (this.__childController__ && this.__childController__.state) {
      console.error("The child controller has not been disposed. Call 'disposeChildController()' first. However, let me do this for you once more...");
      this.__childController__.dispose();
    }
    if (!childController) {
      return;
    }
    if (!this.changeListener) {
      // We need to establish a consistent connection between (Sub-)Controllers and the Application
      // instance to be able to notify the app about changes in the sub state
      // For now, I decided to propagate the application when sub-controllers are attached
      // to parent controllers.
      // This makes sense w.r.t the current mechanism of state transitions which
      // works from top to down. I.e., a parent controller is either the top-level controller
      // or itself a child of an already attached controller.
      // A global/singleton Application instance would be possible, however I reject introducing
      // such an evil thing. It breaks modularity and makes testing harder.
      // Alternatively one could require this to be given when constructing Controllers,
      // however, this would require to change all constructors.
      console.error("This controller does not have a changeListener attached, so the child controller will not trigger corresponding application state changes.");
    } else {
      childController.changeListener = this.changeListener;
    }
    this.__childController__ = childController;
  };

  this.disposeChildController = function() {
    if (this.__childController__) {
      this.__childController__.dispose();
      this.__childController__ = null;
    }
  };

  this.setChangeListener = function(changeListener) {
    this.changeListener = changeListener;
  };

};

Controller.Prototype.prototype = util.Events;
Controller.prototype = new Controller.Prototype();

Controller.State = function(id) {
  if (_.isString(id)) {
    this.__id__ = id;
  } else {
    var obj = arguments[0];
    this.__id__ = obj["id"];
    _.each(obj, function(val, key) {
      if (key === "id") return;
      this[key] = val;
    }, this);
  }
};

Object.defineProperty(Controller.State.prototype, "id", {
  set: function() {
    throw new Error("Property 'id' is immutable");
  },
  get: function() {
    return this.__id__;
  }
});

Object.defineProperty(Controller.prototype, "childController", {
  set: function(childController) {
    this.setChildController(childController);
  },
  get: function() {
    return this.__childController__;
  }
});

module.exports = Controller;

},{"substance-util":127,"underscore":134}],4:[function(require,module,exports){
"use strict";

var util = require("substance-util");
var SRegExp = require("substance-regexp");

// Substance.Application.ElementRenderer
// ==========================================================================
//
// This is just a simple helper that allows us to create DOM elements
// in a data-driven way

var ElementRenderer = function(attributes) {
  this.attributes = attributes;

  // Pull off preserved properties from attributes
  // --------

  this.tagName = attributes.tag;  
  this.children = attributes.children || [];
  this.text = attributes.text || "";
  this.html = attributes.html;
  
  delete attributes.children;
  delete attributes.text;
  delete attributes.html;
  delete attributes.tag;

  return this.render();
};


ElementRenderer.Prototype = function() {

  // Do the actual rendering
  // --------

  this.render = function() {
    var el = document.createElement(this.tagName);
    if (this.html) {
      el.innerHTML = this.html;
    } else {
      el.textContent = this.text;  
    }

    // Set attributes based on element spec
    for(var attrName in this.attributes) {
      var val = this.attributes[attrName];
      el.setAttribute(attrName, val);
    }

    // Append childs
    for (var i=0; i<this.children.length; i++) {
      var child = this.children[i];
      el.appendChild(child);
    }

    // Remember element
    // Probably we should ditch this
    this.el = el;
    return el;
  };
};


// Provides a shortcut syntax interface to ElementRenderer
// --------

var $$ = function(descriptor, options) {
  var options = options  || {};

  // Extract tagName, defaults to 'div'
  var tagName = /^([a-zA-Z0-9]*)/.exec(descriptor);
  options.tag = tagName && tagName[1] ? tagName[1] : 'div';

  // Any occurence of #some_chars
  var id = /#([a-zA-Z0-9_]*)/.exec(descriptor);
  if (id && id[1]) options.id = id[1];

  // Any occurence of .some-chars
  // if (!options.class) {
  //   var re = new RegExp(/\.([a-zA-Z0-9_-]*)/g);
  //   var classes = [];
  //   var classMatch;
  //   while (classMatch = re.exec(descriptor)) {
  //     classes.push(classMatch[1]);
  //   }
  //   options.class = classes.join(' ');
  // }

  // Any occurence of .some-chars
  var matchClasses = new SRegExp(/\.([a-zA-Z0-9_-]*)/g);
  // options.class = options.class ? options.class+' ' : '';
  if (!options.class) {
    options.class = matchClasses.match(descriptor).map(function(m) {
      return m.match[1];
    }).join(' ');
  }
  
  return new ElementRenderer(options);
};



ElementRenderer.$$ = $$;

// Setup prototype chain
ElementRenderer.Prototype.prototype = util.Events;
ElementRenderer.prototype = new ElementRenderer.Prototype();

module.exports = ElementRenderer;
},{"substance-regexp":125,"substance-util":127}],5:[function(require,module,exports){
"use strict";

var util = require("substance-util");
var _ = require("underscore");

// Application.Router
// ---------------
//
// Implementation borrowed from Backbone.js

// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
var Router = function(options) {
  options || (options = {});
  if (options.routes) this.routes = options.routes;
  this._bindRoutes();
  this.initialize.apply(this, arguments);
};

// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
var optionalParam = /\((.*?)\)/g;
var namedParam    = /(\(\?)?:\w+/g;
var splatParam    = /\*\w+/g;
var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

// Set up all inheritable **Application.Router** properties and methods.
_.extend(Router.prototype, util.Events, {

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function(){},

  // Manually bind a single named route to a callback. For example:
  //
  //     this.route('search/:query/p:num', 'search', function(query, num) {
  //       ...
  //     });
  //
  route: function(route, name, callback) {
    if (!_.isRegExp(route)) route = this._routeToRegExp(route);
    if (_.isFunction(name)) {
      callback = name;
      name = '';
    }
    if (!callback) callback = this[name];
    var router = this;
    Router.history.route(route, function(fragment) {
      var args = router._extractParameters(route, fragment);
      callback && callback.apply(router, args);
      router.trigger.apply(router, ['route:' + name].concat(args));
      router.trigger('route', name, args);
      Router.history.trigger('route', router, name, args);
    });
    return this;
  },

  // Simple proxy to `Router.history` to save a fragment into the history.
  navigate: function(fragment, options) {
    Router.history.navigate(fragment, options);
    return this;
  },

  // Bind all defined routes to `Router.history`. We have to reverse the
  // order of the routes here to support behavior where the most general
  // routes can be defined at the bottom of the route map.
  _bindRoutes: function() {
    if (!this.routes) return;
    this.routes = _.result(this, 'routes');
    var route, routes = _.keys(this.routes);
    while ((route = routes.pop()) != null) {
      this.route(route, this.routes[route]);
    }
  },

  // Convert a route string into a regular expression, suitable for matching
  // against the current location hash.
  _routeToRegExp: function(route) {
    route = route.replace(escapeRegExp, '\\$&')
                 .replace(optionalParam, '(?:$1)?')
                 .replace(namedParam, function(match, optional){
                   return optional ? match : '([^\/]+)';
                 })
                 .replace(splatParam, '(.*?)');
    return new RegExp('^' + route + '$');
  },

  // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  _extractParameters: function(route, fragment) {
    var params = route.exec(fragment).slice(1);
    return _.map(params, function(param) {
      return param ? decodeURIComponent(param) : null;
    });
  }
});




// Router.History
// ----------------

// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments. If the browser supports neither (old IE, natch),
// falls back to polling.
var History = Router.History = function() {
  this.handlers = [];
  _.bindAll(this, 'checkUrl');

  // Ensure that `History` can be used outside of the browser.
  if (typeof window !== 'undefined') {
    this.location = window.location;
    this.history = window.history;
  }
};

// Cached regex for stripping a leading hash/slash and trailing space.
var routeStripper = /^[#\/]|\s+$/g;

// Cached regex for stripping leading and trailing slashes.
var rootStripper = /^\/+|\/+$/g;

// Cached regex for detecting MSIE.
var isExplorer = /msie [\w.]+/;

// Cached regex for removing a trailing slash.
var trailingSlash = /\/$/;

// Has the history handling already been started?
History.started = false;

// Set up all inheritable **Router.History** properties and methods.
_.extend(History.prototype, util.Events, {

  // The default interval to poll for hash changes, if necessary, is
  // twenty times a second.
  interval: 50,

  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  getHash: function(window) {
    var match = (window || this).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  },

  // Get the cross-browser normalized URL fragment, either from the URL,
  // the hash, or the override.
  getFragment: function(fragment, forcePushState) {
    if (fragment == null) {
      if (this._hasPushState || !this._wantsHashChange || forcePushState) {
        fragment = this.location.pathname;
        var root = this.root.replace(trailingSlash, '');
        if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
      } else {
        fragment = this.getHash();
      }
    }
    return fragment.replace(routeStripper, '');
  },

  // Start the hash change handling, returning `true` if the current URL matches
  // an existing route, and `false` otherwise.
  start: function(options) {
    if (History.started) throw new Error("Router.history has already been started");
    History.started = true;

    // Figure out the initial configuration. Do we need an iframe?
    // Is pushState desired ... is it available?
    this.options          = _.extend({}, {root: '/'}, this.options, options);
    this.root             = this.options.root;
    this._wantsHashChange = this.options.hashChange !== false;
    this._wantsPushState  = !!this.options.pushState;
    this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
    var fragment          = this.getFragment();
    var docMode           = document.documentMode;
    var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

    // Normalize root to always include a leading and trailing slash.
    this.root = ('/' + this.root + '/').replace(rootStripper, '/');

    if (oldIE && this._wantsHashChange) {
      this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
      this.navigate(fragment);
    }

    // Depending on whether we're using pushState or hashes, and whether
    // 'onhashchange' is supported, determine how we check the URL state.
    if (this._hasPushState) {
      $(window).on('popstate', this.checkUrl);
    } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
      $(window).on('hashchange', this.checkUrl);
    } else if (this._wantsHashChange) {
      this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
    }

    // Determine if we need to change the base url, for a pushState link
    // opened by a non-pushState browser.
    this.fragment = fragment;
    var loc = this.location;
    var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

    // If we've started off with a route from a `pushState`-enabled browser,
    // but we're currently in a browser that doesn't support it...
    if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
      this.fragment = this.getFragment(null, true);
      this.location.replace(this.root + this.location.search + '#' + this.fragment);
      // Return immediately as browser will do redirect to new url
      return true;

    // Or if we've started out with a hash-based route, but we're currently
    // in a browser where it could be `pushState`-based instead...
    } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
      this.fragment = this.getHash().replace(routeStripper, '');
      this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
    }

    if (!this.options.silent) return this.loadUrl();
  },

  // Disable Router.history, perhaps temporarily. Not useful in a real app,
  // but possibly useful for unit testing Routers.
  stop: function() {
    $(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
    clearInterval(this._checkUrlInterval);
    History.started = false;
  },

  // Add a route to be tested when the fragment changes. Routes added later
  // may override previous routes.
  route: function(route, callback) {
    this.handlers.unshift({route: route, callback: callback});
  },

  // Checks the current URL to see if it has changed, and if it has,
  // calls `loadUrl`, normalizing across the hidden iframe.
  checkUrl: function(e) {
    var current = this.getFragment();
    if (current === this.fragment && this.iframe) {
      current = this.getFragment(this.getHash(this.iframe));
    }
    if (current === this.fragment) return false;
    if (this.iframe) this.navigate(current);
    this.loadUrl() || this.loadUrl(this.getHash());
  },

  // Attempt to load the current URL fragment. If a route succeeds with a
  // match, returns `true`. If no defined routes matches the fragment,
  // returns `false`.
  loadUrl: function(fragmentOverride) {
    var fragment = this.fragment = this.getFragment(fragmentOverride);
    var matched = _.any(this.handlers, function(handler) {
      if (handler.route.test(fragment)) {
        handler.callback(fragment);
        return true;
      }
    });
    return matched;
  },

  // Save a fragment into the hash history, or replace the URL state if the
  // 'replace' option is passed. You are responsible for properly URL-encoding
  // the fragment in advance.
  //
  // The options object can contain `trigger: true` if you wish to have the
  // route callback be fired (not usually desirable), or `replace: true`, if
  // you wish to modify the current URL without adding an entry to the history.
  navigate: function(fragment, options) {
    if (!History.started) return false;
    if (!options || options === true) options = {trigger: options};
    fragment = this.getFragment(fragment || '');
    if (this.fragment === fragment) return;
    this.fragment = fragment;
    var url = this.root + fragment;

    // If pushState is available, we use it to set the fragment as a real URL.
    if (this._hasPushState) {
      this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

    // If hash changes haven't been explicitly disabled, update the hash
    // fragment to store history.
    } else if (this._wantsHashChange) {
      this._updateHash(this.location, fragment, options.replace);
      if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
        // Opening and closing the iframe tricks IE7 and earlier to push a
        // history entry on hash-tag change.  When replace is true, we don't
        // want this.
        if(!options.replace) this.iframe.document.open().close();
        this._updateHash(this.iframe.location, fragment, options.replace);
      }

    // If you've told us that you explicitly don't want fallback hashchange-
    // based history, then `navigate` becomes a page refresh.
    } else {
      return this.location.assign(url);
    }
    if (options.trigger) this.loadUrl(fragment);
  },

  // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  _updateHash: function(location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  }
});

Router.history = new History;


module.exports = Router;
},{"substance-util":127,"underscore":134}],6:[function(require,module,exports){
"use strict";

var util = require("substance-util");

// Substance.View
// ==========================================================================
//
// Application View abstraction, inspired by Backbone.js

var View = function(options) {
  var that = this;

  // Either use the provided element or make up a new element
  this.$el = $('<div/>');
  this.el = this.$el[0];

  this.dispatchDOMEvents();
};


View.Prototype = function() {

  // Default dispose function
  // --------
  //

  this.dispose = function() {
    this.stopListening();
  };

  // Shorthand for selecting elements within the view
  // ----------
  //

  this.$ = function(selector) {
    return this.$el.find(selector);
  };

  // Dispatching DOM events (like clicks)
  // ----------
  //

  this.dispatchDOMEvents = function() {

    var that = this;

    // showReport(foo) => ["showReport(foo)", "showReport", "foo"]
    // showReport(12) => ["showReport(12)", "showReport", "12"]
    function extractFunctionCall(str) {
      var match = /(\w+)\((.*)\)/.exec(str);
      if (!match) throw new Error("Invalid click handler '"+str+"'");

      return {
        "method": match[1],
        "args": match[2].split(',')
      };
    }

    this.$el.delegate('[sbs-click]', 'click', function(e) {

      // Matches things like this
      // showReport(foo) => ["showReport(foo)", "showReport", "foo"]
      // showReport(12) => ["showReport(12)", "showReport", "12"]
      var fnCall = extractFunctionCall($(e.currentTarget).attr('sbs-click'));

      // Event bubbles up if there is no handler
      var method = that[fnCall.method];
      if (method) {
        method.apply(that, fnCall.args);
        return false;
      }
    });
  };

  this.updateTitle = function(newTitle) {
    document.title = newTitle;
    window.history.replaceState({}, document.title, window.location.href);
  };

};


View.Prototype.prototype = util.Events;
View.prototype = new View.Prototype();

module.exports = View;

},{"substance-util":127}],7:[function(require,module,exports){
"use strict";

var Article = require("./src/article");
Article.Renderer = require("./src/renderer");
Article.ViewFactory = require("./src/view_factory");

module.exports = Article;

},{"./src/article":9,"./src/renderer":10,"./src/view_factory":11}],8:[function(require,module,exports){
"use strict";

var _ = require("underscore");

var nodes = {};

// TODO: we should change the 'substance-nodes' module in that way,
// that it provides a function that gives the cloned set
_.each(require("substance-nodes"), function(spec, name) {
  nodes[name] = _.clone(spec);
});

module.exports = nodes;

},{"substance-nodes":36,"underscore":134}],9:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var Document = require("substance-document");
var Annotator = Document.Annotator;

// Substance.Article
// -----------------

var Article = function(options) {
  options = options || {};

  // TODO: Check if format is compatible

  // Extend Schema
  // --------

  options.schema = util.deepclone(Document.schema);
  options.schema.id = "substance-article";
  options.schema.version = "0.3.0";

  // Merge in custom types
  var types = options.types || Article.types;
  _.each(types, function(type, key) {
    options.schema.types[key] = type;
  });

  // Merge in node types
  var nodeTypes = options.nodeTypes || Article.nodeTypes;
  _.each(nodeTypes, function(node, key) {
    options.schema.types[key] = node.Model.type;
  });

  // Merge in custom indexes
  var indexes = options.indexes || Article.indexes;
  _.each(indexes, function(index, key) {
    options.schema.indexes[key] = index;
  });

  var views = options.views || Article.views;

  // Call parent constructor
  // --------

  Document.call(this, options);

  this.nodeTypes = nodeTypes;

  // Seed the doc
  // --------

  if (options.seed === undefined) {
    this.create({
      id: "document",
      type: "document",
      guid: options.id, // external global document id
      creator: options.creator,
      created_at: options.created_at,
      views: ["content"], // is views really needed on the instance level
      title: "",
      abstract: "",
    });

    // Create views on the doc
    _.each(views, function(view) {
      this.create({
        id: view,
        "type": "view",
        nodes: []
      });
    }, this);
  }
};

Article.Prototype = function() {

  this.fromSnapshot = function(data, options) {
    return Article.fromSnapshot(data, options);
  };

  this.getAuthorNames = function() {
    return _.map(this.getAuthors(), function(a) {
      return a.name;
    });
  };

  this.getAuthors = function() {
    return _.map(this.authors, function(cid) {
      return this.get(cid);
    }, this);
  };

  // Set publication date
  // --------
  //

  this.setPublishedOn = function(dat) {
    this.set(["document", "published_on"], dat);
  };

  // Set document id (stored on document node)
  // --------
  //

  this.setId = function(docId) {
    this.set(["document", "guid"], docId);
  }

  // Set document title (stored on document node)
  // --------
  //

  this.setTitle = function(title) {
    this.set(["document", "title"], title);
  };

  // Set authors (stored on document node)
  // --------
  //

  this.setAuthors = function(authors) {
    this.set(["document", "authors"], authors);
  };

  this.createRenderer = function(viewName) {
    return new Article.Renderer(this, viewName);
  };

  this.getAnnotationBehavior = function() {
    return Article.annotationBehavior;
  }
};

// Factory method
// --------
//
// TODO: Ensure the snapshot doesn't get chronicled

Article.fromSnapshot = function(data, options) {
  options = options || {};
  options.seed = data;
  return new Article(options);
};


// Define available views
// --------

Article.views = ["content", "figures", "citations", "info"];

// Register node types
// --------


Article.nodeTypes = require("../nodes");


// Define annotation types
// --------

Article.annotationBehavior = {
  groups: {
    "emphasis": "style",
    "strong": "style",
    "link": "style",
    "math": "style",
    "issue": "marker"
  },
  expansion: {
    "emphasis": {
      left: Annotator.isOnNodeStart,
    },
    "strong": {
      left: Annotator.isOnNodeStart,
    }
  },
  split: ["emphasis", "strong"],
  levels: {
    idea: 1,
    question: 1,
    remark: 1,
    error: 1,
    issue: 1,
    link: 1,
    math: 1,
    strong: 2,
    emphasis: 2,
    code: 2,
    subscript: 2,
    superscript: 2,
    underline: 2,
    cross_reference: 1,
    figure_reference: 1,
    person_reference: 1,
    contributor_reference: 1,
    citation_reference: 1,
    remark_reference: 1,
    error_reference: 1
  }
};

// Custom type definitions
// --------
//

Article.types = {

  // Document
  // --------

  "document": {
    "properties": {
      "views": ["array", "view"],
      "guid": "string",
      "creator": "string",
      "authors": ["array", "contributor"],
      "title": "string",
      "abstract": "string",
      "created_at": "date",
      "updated_at": "date",
      "published_on": "date", // should be part of the main type?
      "meta": "object"
    }
  }
};

// Custom indexes
// --------
//

Article.indexes = {
  // all comments are now indexed by node association
  "comments": {
    "type": "comment",
    "properties": ["node"]
  }
};


// From article definitions generate a nice reference document
// --------
//

var ARTICLE_DOC_SEED = {
  "id": "article",
  "nodes": {
    "document": {
      "type": "document",
      "id": "document",
      "views": [
        "content",
        "info"
      ],
      "title": "The Anatomy of a Substance Article",
      "authors": ["contributor_1", "contributor_2"],
      "guid": "lens_article"
    },

    "content": {
      "type": "view",
      "id": "content",
      "nodes": [
        "cover",
      ]
    },

    "cover": {
      "id": "cover",
      "type": "cover"
    },

    "contributor_1": {
      "id": "contributor_1",
      "type": "contributor",
      "name": "Michael Aufreiter"
    },

    "contributor_2": {
      "id": "contributor_2",
      "type": "contributor",
      "name": "Oliver Buchtala"
    }
  }
};


Article.describe = function() {
  var doc = new Article({seed: ARTICLE_DOC_SEED});

  var id = 0;

  _.each(Article.nodeTypes, function(nodeType, key) {
    if (key === "composite") return;
    nodeType = nodeType.Model;

    // Create a heading for each node type
    var headingId = "heading_"+nodeType.type.id;

    doc.create({
      id: headingId,
      type: "heading",
      content: nodeType.description.name,
      level: 1
    });

    // Turn remarks and description into an introduction paragraph
    var introText = nodeType.description.remarks.join(' ');
    var introId = "text_"+nodeType.type.id+"_intro";

    doc.create({
      id: introId,
      type: "text",
      content: introText,
    });


    // Show it in the content view
    doc.show("content", [headingId, introId], -1);


    // Include property description
    // --------
    //

    doc.create({
      id: headingId+"_properties",
      type: "text",
      content: nodeType.description.name+ " uses the following properties:"
    });

    doc.show("content", [headingId+"_properties"], -1);

    var items = [];

    _.each(nodeType.description.properties, function(propertyDescr, key) {

      var listItemId = "text_" + (++id);
      doc.create({
        id: listItemId,
        type: "text",
        content: key +": " + propertyDescr
      });

      // Create code annotation for the propertyName
      doc.create({
        "id": id+"_annotation",
        "type": "code",
        "path": [listItemId, "content"],
        "range":[0, key.length]
      });

      items.push(listItemId);
    });

    // Create list
    doc.create({
      id: headingId+"_property_list",
      type: "list",
      items: items,
      ordered: false
    });

    // And show it
    doc.show("content", [headingId+"_property_list"], -1);

    // Include example
    // --------

    if (nodeType.example) {
      doc.create({
        id: headingId+"_example",
        type: "text",
        content: "Here's an example:"
      });

      doc.create({
        id: headingId+"_example_codeblock",
        type: "codeblock",
        content: JSON.stringify(nodeType.example, null, '  '),
      });
      doc.show("content", [headingId+"_example", headingId+"_example_codeblock"], -1);
    }
  });

  return doc;
};


Article.Prototype.prototype = Document.prototype;
Article.prototype = new Article.Prototype();
Article.prototype.constructor = Article;

// Add convenience accessors for builtin document attributes
Object.defineProperties(Article.prototype, {
  id: {
    get: function() {
      return this.get("document").guid;
    },
    set: function(id) {
      throw new Error("This is a read-only property alias.");
    }
  },
  creator: {
    get: function() {
      return this.get("document").creator;
    },
    set: function() {
      this.get("document").creator = creator;
    }
  },
  authors: {
    get: function() {
      return this.get("document").authors;
    },
    set: function() {
      throw new Error("This is a read-only property alias.");
    }
  },
  updated_at: {
    get: function() {
      return this.get("document").updated_at;
    },

    // This is going to be called very often
    // Any operation will trigger it
    // maybe we can optimize here
    set: function(val) {
      this.get("document").updated_at = val;
    }
  },
  created_at: {
    get: function() {
      return this.get("document").created_at;
    },
    set: function() {
      throw new Error("This is a read-only property alias.");
    }
  },
  published_on: {
    get: function() {
      return this.get("document").published_on;
    },
    set: function() {
      throw new Error("This is a read-only property alias.");
    }
  },
  title: {
    get: function() {
      return this.get("document").title;
    },
    set: function() {
      throw new Error("This is a read-only property alias.");
    }
  },
  abstract: {
    get: function() {
      return this.get("document").abstract;
    },
    set: function() {
      throw new Error("This is a read-only property alias.");
    }
  },
  views: {
    get: function() {
      // Note: returing a copy to avoid inadvertent changes
      return this.get("document").views.slice(0);
    },
    set: function(views) {
      throw new Error("This is a read-only property alias.");
    }
  }
});

module.exports = Article;

},{"../nodes":8,"substance-document":28,"substance-util":127,"underscore":134}],10:[function(require,module,exports){
"use strict";

var ViewFactory = require("./view_factory");
var _ = require("underscore");

// Renders an article
// --------
//

var ArticleRenderer = function(document, viewName, options) {
  ViewFactory.call(this, document);

  this.viewName = viewName;
  this.options = options || {};
  this.nodeViews = {};
};

ArticleRenderer.Prototype = function() {

  var __super__ = ViewFactory.prototype;

  // Note: it is important to recreate a view to be able to dispose child views
  // and not having to reuse all the time.
  this.createView = function(node, overwrite) {
    if (this.nodeViews[node.id] && !overwrite) {
      return this.nodeViews[node.id];
    } else if (this.nodeViews[node.id] && overwrite) {
      this.nodeViews[node.id].dispose();
    }

    var nodeView = __super__.createView.call(this, node);
    this.nodeViews[node.id] = nodeView;
    return nodeView;
  };

  // Render it
  // --------
  //

  this.render = function() {
    _.each(this.nodeViews, function(nodeView) {
      nodeView.dispose();
    });

    var frag = document.createDocumentFragment();

    var nodeIds = this.document.get(this.viewName).nodes;
    _.each(nodeIds, function(id) {
      var node = this.document.get(id);
      var view = this.createView(node);
      frag.appendChild(view.render().el);

      // Lets you customize the resulting DOM sticking on the el element
      // Example: Lens focus controls
      if (this.options.afterRender) {
        this.options.afterRender(this.document, view);
      }
    }, this);

    return frag;
  };

};

ArticleRenderer.Prototype.prototype = ViewFactory.prototype;
ArticleRenderer.prototype = new ArticleRenderer.Prototype();

module.exports = ArticleRenderer;

},{"./view_factory":11,"underscore":134}],11:[function(require,module,exports){
"use strict";

var ViewFactory = function(document) {
  this.document = document;
  this.nodeTypes = document.nodeTypes;
};

ViewFactory.Prototype = function() {

  // Create a node view
  // --------
  //
  // Experimental: using a factory which creates a view for a given node type
  // As we want to be able to reuse views
  // However, as the matter is still under discussion consider the solution here only as provisional.
  // We should create views, not only elements, as we need more, e.g., event listening stuff
  // which needs to be disposed later.

  this.createView = function(node) {
    var NodeView = this.nodeTypes[node.type].View;
    if (!NodeView) {
      throw new Error('Node type "'+node.type+'" not supported');
    }
    // Note: passing the renderer to the node views
    // to allow creation of nested views
    var nodeView = new NodeView(node, this);

    // we connect the listener here to avoid to pass the document itself into the nodeView
    nodeView.listenTo(this.document, "operation:applied", nodeView.onGraphUpdate);

    return nodeView;
  };

};

ViewFactory.prototype = new ViewFactory.Prototype();

module.exports = ViewFactory;

},{}],12:[function(require,module,exports){
"use strict";

var Chronicle = require('./src/chronicle');

Chronicle.IndexImpl = require('./src/index_impl');
Chronicle.ChronicleImpl = require('./src/chronicle_impl');
Chronicle.DiffImpl = require('./src/diff_impl');
Chronicle.TmpIndex = require('./src/tmp_index');

Chronicle.create = Chronicle.ChronicleImpl.create;
Chronicle.Index.create = Chronicle.IndexImpl.create;
Chronicle.Diff.create = Chronicle.DiffImpl.create;

Chronicle.ArrayOperationAdapter = require('./src/array_adapter');
Chronicle.TextOperationAdapter = require('./src/text_adapter');

Chronicle.IndexedDBBackend = require("./src/backends/indexeddb_backend");

module.exports = Chronicle;

},{"./src/array_adapter":13,"./src/backends/indexeddb_backend":14,"./src/chronicle":15,"./src/chronicle_impl":16,"./src/diff_impl":17,"./src/index_impl":18,"./src/text_adapter":19,"./src/tmp_index":20}],13:[function(require,module,exports){
"use strict";

var util = require('substance-util');
var Chronicle = require('./chronicle');
var ArrayOperation = require('substance-operator').ArrayOperation;

var ArrayOperationAdapter = function(chronicle, array) {
  Chronicle.Versioned.call(this, chronicle);
  this.array = array;
};

ArrayOperationAdapter.Prototype = function() {

  var __super__ = util.prototype(this);

  this.apply = function(change) {
    ArrayOperation.fromJSON(change).apply(this.array);
  };

  this.invert = function(change) {
    return ArrayOperation.fromJSON(change).invert();
  };

  this.transform = function(a, b, options) {
    return ArrayOperation.transform(a, b, options);
  };

  this.reset = function() {
    __super__.reset.call(this);
    while(this.array.length > 0) {
      this.array.shift();
    }
  };

};

ArrayOperationAdapter.Prototype.prototype = Chronicle.Versioned.prototype;
ArrayOperationAdapter.prototype = new ArrayOperationAdapter.Prototype();

module.exports = ArrayOperationAdapter;

},{"./chronicle":15,"substance-operator":118,"substance-util":127}],14:[function(require,module,exports){
"use strict";

var util = require("substance-util");
var _ = require("underscore");
var Chronicle = require("../chronicle");
var Index = Chronicle.Index;

var IndexedDbBackend = function(name, index) {
  this.name = name;
  this.index = index;
  this.db = null;
};

IndexedDbBackend.Prototype = function() {

  this.delete = function(cb) {
    var self = this;
    this.clear(function() {
      window.indexedDB.deleteDatabase(self.name);
      cb(null);
    });
  };

  var __clearObjectStore = function(db, name, cb) {
    var transaction = db.transaction([name], "readwrite");
    var objectStore = transaction.objectStore(name);
    var request = objectStore.clear();
    request.onsuccess = function() {
      cb(null);
    };
    request.onerror = function(err) {
      cb(err);
    };
  };

  this.clear = function(cb) {
    var db = this.db;
    var names = ["changes", "snapshots", "refs"];
    util.async.each({
      items: names,
      iterator: function(name, cb) {
        __clearObjectStore(db, name, cb);
      }
    }, cb);
  };

  this.open = function(cb) {
    var self = this;
    // reset this.db to make sure it is only available when successfully opened.
    this.db = null;

    var request = window.indexedDB.open(this.name, 1);
    request.onupgradeneeded = function(event) {
      var db = event.target.result;
      db.createObjectStore("changes", { keyPath: "id" });
      var snapshots = db.createObjectStore("snapshots", { keyPath: "sha" });
      snapshots.createIndex("sha", "sha", {unique:true});
      var refs = db.createObjectStore("refs", { keyPath: "name" });
      refs.createIndex("name", "name", {unique:true});
    };
    request.onerror = function(event) {
      console.error("Could not open database", self.name);
      cb(event);
    };
    request.onsuccess = function(event) {
      // console.log("Opened database", self.name);
      self.db = event.target.result;
      cb(null);
    };
  };

  this.close = function(cb) {
    // console.log("IndexedDbBackend.close()");
    var self = this;
    this.db.close();
    if (cb) cb(null);
  };

  // Load all stored changes into the memory index
  this.load = function(cb) {
    var self = this;
    var transaction = this.db.transaction(["changes", "refs"]);
    var objectStore = transaction.objectStore("changes");

    var iterator = objectStore.openCursor();
    var changes = {};
    iterator.onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        changes[cursor.key] = cursor.value;
        cursor.continue();
        return;
      }
      // Note: Index.adapt() mimics a hash to be a Chronicle.Index.
      self.index.import(Index.adapt(changes));

      var refStore = transaction.objectStore("refs");
      iterator = refStore.openCursor();
      iterator.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          self.index.setRef(cursor.key, cursor.value["sha"]);
          cursor.continue();
          return;
        }
        cb(null);
      };
      iterator.onerror = function(event) {
        console.error("Error during loading...", event);
        cb(event);
      };
    };
    iterator.onerror = function(event) {
      console.error("Error during loading...", event);
      cb(event);
    };
  };

  var _saveChanges = function(self, cb) {
    // TODO: we should use a special index which keeps track of new changes to be synched
    // for now brute-forcely overwriting everything
    var transaction = self.db.transaction(["changes"], "readwrite");
    transaction.onerror = function(event) {
      console.error("Error while saving changes.");
      if (cb) cb(event);
    };
    transaction.oncomplete = function() {
      if (cb) cb(null);
    };

    // NOTE: brute-force. Saving all changes everytime. Should be optimized someday.
    var changes = transaction.objectStore("changes");
    self.index.foreach(function(change) {
      var data = change;
      if (change instanceof Chronicle.Change) {
        data = change.toJSON();
      }
      var request = changes.put(data);
      request.onerror = function(event) {
        console.error("Could not add change: ", change.id, event);
      };
    });
  };

  var _saveRefs = function(self, cb) {
    // TODO: we should use a special index which keeps track of new changes to be synched
    // for now brute-forcely overwriting everything
    var transaction = self.db.transaction(["refs"], "readwrite");
    transaction.onerror = function(event) {
      console.error("Error while saving refs.");
      if (cb) cb(event);
    };
    transaction.oncomplete = function() {
      // console.log("...saved refs");
      if (cb) cb(null);
    };

    var refs = transaction.objectStore("refs");
    _.each(self.index.listRefs(), function(name) {
      var data = {
        name: name,
        sha: self.index.getRef(name)
      };
      var request = refs.put(data);
      request.onerror = function(event) {
        console.error("Could not store ref: ", data, event);
      };
    });
  };

  this.save = function(cb) {
    // console.log("IndexedDbBackend.save()");
    var self = this;
    _saveChanges(self, function(error) {
      if (error) return cb(error);
      // console.log("...saved changes.");
      _saveRefs(self, cb);
    });
  };

  this.saveSnapshot = function(sha, document, cb) {
    var transaction = this.db.transaction(["snapshots"], "readwrite");
    transaction.oncomplete = function() {
      // console.log("Saved snapshot.");
      cb(null);
    };
    transaction.onerror = function(event) {
      console.error("Error while saving snapshot.");
      cb(event);
    };

    var snapshots = transaction.objectStore("snapshots");
    var data = document;
    // if the provided document has a toJSON function
    // apply it before serialization
    if (data.toJSON) data = data.toJSON();
    data.sha = sha;
    var request = snapshots.put(data);
    request.onerror = function(event) {
      console.error("Could not add snapshot: ", data, event);
    };
  };

  this.listSnapshots = function(cb) {
    var transaction = this.db.transaction(["snapshots"], "readonly");
    var objectStore = transaction.objectStore("snapshots");
    var index = objectStore.index("sha");
    var iterator = index.openCursor();
    var snapshots = [];

    iterator.onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        snapshots.push(cursor.key);
        cursor.continue();
        return;
      }
      cb(null, snapshots);
    };
    iterator.onerror = function(event) {
      console.error("Error during loading...", event);
      cb(event);
    };
  };

  this.getSnapshot = function(sha, cb) {
    var transaction = this.db.transaction(["snapshots"], "readonly");
    var snapshots = transaction.objectStore("snapshots");
    var request = snapshots.get(sha);
    request.onsuccess = function(event) {
      var snapshot = event.target.result;
      cb(null, snapshot);
    };
    request.onerror = function(event) {
      console.error("Error: could not load snapshot for sha", sha);
      cb(event);
    };
  };
};
IndexedDbBackend.prototype = new IndexedDbBackend.Prototype();

module.exports = IndexedDbBackend;

},{"../chronicle":15,"substance-util":127,"underscore":134}],15:[function(require,module,exports){
"use strict";

/*jshint unused: false*/ // deactivating this, as we define abstract interfaces here

var _ = require('underscore');
var util = require('substance-util');
var errors = util.errors;

errors.define("ChronicleError", -1);
errors.define("ChangeError", -1);

// A change recorded in the chronicle
// ========
//
// Each change has an unique id (equivalent to git SHA).
// A change can have multiple parents (merge).
//
// options:
//   - id: a custom id for the change

var Change = function(id, parent, data) {

  this.type = 'change';

  if (!id) {
    throw new errors.ChangeError("Every change needs a unique id.");
  }
  this.id = id;

  if (!parent) {
    throw new errors.ChangeError("Every change needs a parent.");
  }

  this.parent = parent;

  // Application specific data
  // --------
  //
  // This needs to contain all information to be able to apply and revert
  // a change.

  this.data = data;

  this.uuid = util.uuid;

};

Change.prototype = {

  toJSON: function() {
    return {
      type: this.type,
      id: this.id,
      parent: this.parent,
      data: this.data
    };
  }

};

Change.fromJSON = function(json) {
  if (json.type === Merge.TYPE) return new Merge(json);
  if (json.type === Transformed.TYPE) return new Transformed(json);

  return new Change(json.parent, json.data, json);
};

// a dedicated global root node
var ROOT = "ROOT";
var ROOT_NODE = new Change(ROOT, true, null);
ROOT_NODE.parent = ROOT;

// A dedicated Change for merging multiple Chronicle histories.
// ========
//
// A merge is described by a command containing a diff for each of the parents (see Index.diff()).
//
// Example: Consider two sequences of changes [c0, c11, c12] and [c0, c21, c22, c23].
//
//  A merge taking all commits of the second ('theirs') branch and
//  rejecting those of the first ('mine') would be:
//
//    merge = {
//      "c12": ["-", "c11", "c0" "+", "c21", "c22", "c23"],
//      "c23": []
//    }
//
// A manually selected merge with [c11, c21, c23] would look like:
//
//    merge = {
//      "c12": ["-", "c11", "+", "c21", "c23"],
//      "c23": ["-", "c22", "c21", "c0", "+", "c11", "c21", "c23"]
//    }
//

var Merge = function(id, main, branches) {
  Change.call(this, id, main);
  this.type = Merge.TYPE;

  if (!branches) {
    throw new errors.ChangeError("Missing branches.");
  }
  this.branches = branches;
};

Merge.Prototype = function() {

  var __super__ = util.prototype(this);

  this.toJSON = function() {
    var result = __super__.toJSON.call(this);
    result.type = Merge.TYPE;
    result.branches = this.branches;
    return result;
  };

};
Merge.Prototype.prototype = Change.prototype;
Merge.prototype = new Merge.Prototype();

Merge.TYPE =  "merge";

Merge.fromJSON = function(data) {
  if (data.type !== Merge.TYPE) throw new errors.ChangeError("Illegal data for deserializing a Merge node.");
  return new Merge(data.parent, data.branches, data);
};

// Transformed changes are those which have been
// created by transforming (rebasing) another existing change.
// For the time being, the data is persisted redundantly.
// To be able to track the original source of the change,
// this type is introduced.
var Transformed = function(id, parent, data, original) {
  Change.call(this, id, parent, data);
  this.type = Transformed.TYPE;
  this.original = original;
};

Transformed.Prototype = function() {

  var __super__ = util.prototype(this);

  this.toJSON = function() {
    var result = __super__.toJSON.call(this);
    result.type = Transformed.TYPE;
    result.original = this.original;
    return result;
  };

};

Transformed.TYPE = "transformed";

Transformed.fromJSON = function(json) {
  if (json.type !== Transformed.TYPE) throw new errors.ChangeError("Illegal data for deserializing a Transformed node.");
  return new Transformed(json.parent, json.data, json.original, json);
};


Transformed.Prototype.prototype = Change.prototype;
Transformed.prototype = new Transformed.Prototype();

// A class that describes the difference of two states by
// a sequence of changes (reverts and applies).
// =======
//
// The difference is a sequence of commands that forms a transition from
// one state to another.
//
// A diff is specified using the following syntax:
//    [- sha [shas ...]] [+ sha [shas ...]]
// where '-' preceeds a sequence reverts and '+' a sequence of applies.
// Any diff can be described in that order (reverts followed by applies)
//
// Example: Consider an index containing the following changes
//
//        , - c11 - c12
//      c0
//        ` - c21 - c22 - c23
//
// Diffs for possible transitions look like:
// "c21" -> "c23" : ["+", "c22", "c23"]
// "c12" -> "c0" :  ["-", "c11", "c0" ]
// "c21" -> "c11" : ["-", "c0", "+", "c11"]

var Diff = function() {};

Diff.prototype = {

  hasReverts: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  // Provides the changes that will be reverted
  // --------

  reverts: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  hasApplies: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  // Provides the changes that will applied
  // --------

  applies: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  // Provides the sequence of states visited by this diff.
  // --------

  sequence: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  // Provides the path from the root to the first change
  // --------
  //
  // The naming refers to a typical diff situation where
  // two branches are compared. The first branch containing the own
  // changes, the second one the others.

  mine: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  // Provides the path from the root to the second change
  // --------
  //

  theirs: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  // Provides the common root of the compared branches.
  // --------
  //

  root: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  // Provides the version this diff has to be applied on.
  // --------

  start: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  // Provides the version which is generated by applying this diff.
  // --------

  end: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

  // Provides a copy that represents the inversion of this diff.
  // --------

  inverted: function() {
    throw new errors.SubstanceError("Not implemented.");
  },

};

// Creates a new diff for the given reverts and applies
// --------
// Note this factory is provided when loading index_impl.js

Diff.create = function(reverts, applies) {
  /*jshint unused: false*/
  throw new errors.SubstanceError("Not implemented.");
};


// A Chronicle contains the history of a versioned object.
// ========
//

var Chronicle = function(index, options) {
  options = options || {};

  // an instance implementing the 'Index' interface
  this.index = index;

  // the versioned object which must implement the 'Versioned' interface.
  this.versioned = null;

  // flags to control the chronicle's behaviour
  this.__mode__ = options.mode || Chronicle.DEFAULT_MODE;
};

Chronicle.Prototype = function() {

  // Records a change
  // --------
  //
  // Creates a commit and inserts it into the index at the current position.
  //
  // An application should call this after having applied the change to the model successfully.
  // The provided 'change' should contain every information that is necessary to
  // apply the change in both directions (apply and revert).
  //
  // Note: this corresponds to a 'git commit' in git.

  this.record = function(change) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Opens a specific version.
  // --------
  //
  // Brings the versioned object as well as the index to the state
  // of the given state.
  //

  this.open = function(version) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Performs an incremental transformation.
  // --------
  //
  // The given state must be a direct neighbor of the current state.
  // For convenience a sequence of consecutive states can be given.
  //
  // Call this if you already know path between two states
  // or if you want to apply or revert a single change.
  //
  // Returns the change applied by the step.
  //

  this.step = function(next) {
    throw new errors.SubstanceError("Not implemented.");
  };

  this.forward = function(toward) {
    var state = this.versioned.getState();
    if (state === toward) return;

    var children = this.index.children[state];

    if (children.length === 0) return;

    var next;

    if (children.length === 1) {
      next = children[0];
    }
    else if (toward) {
      var path = this.index.shortestPath(state, toward);
      path.shift();
      next = path.shift();
    }
    else {
      next = children[children.length-1];
    }

    if (next) {
      return this.step(next);
    } else {
      return;
    }
  };

  this.rewind = function() {
    var current = this.index.get(this.versioned.getState());
    var previous;
    if (current.id === ROOT) return null;

    previous = current.parent;
    return this.step(previous);
  };

  // Create a commit that merges a history specified by its last commit.
  // --------
  //
  // The strategy specifies how the merge should be generated.
  //
  //  'mine':   reject the changes of the other branch
  //  'theirs': reject the changes of this branch
  //  'manual': compute a merge that leads to the given sequence.
  //
  // Returns the id of the new state.
  //

  this.merge = function(state, strategy, sequence) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Making this instance the chronicler of the given Versioned instance.
  // --------
  //

  this.manage = function(versioned) {
    this.versioned = versioned;
  };

  // Marks the current version.
  // --------
  //

  this.mark = function(name) {
    this.index.setRef(name, this.versioned.getState());
  };

  // Provides the id of a previously marked version.
  // --------
  //

  this.find = function(name) {
    return this.index.getRef(name);
  };

  // Get the current version.
  // --------
  //

  this.getState = function() {
    return this.versioned.getState();
  };

  // Retrieve changes.
  // --------
  //
  // If no range is given a full path is returned.

  this.getChanges = function(start, end) {
    var changes = [];
    var path = this.path(start, end);

    _.each(path, function(id) {
      changes.push(this.index.get(id));
    }, this);

    return changes;
  };

};

Chronicle.prototype = new Chronicle.Prototype();

// only allow changes that have been checked via instant apply+revert
Chronicle.PEDANTIC_RECORD = 1 << 1;

// performs a reset for all imported changes
Chronicle.PEDANTIC_IMPORT = 1 << 2;

Chronicle.HYSTERICAL = Chronicle.PEDANTIC_RECORD | Chronicle.PEDANTIC_IMPORT;
Chronicle.DEFAULT_MODE = Chronicle.PEDANTIC_IMPORT;

// The factory method to create a Chronicle instance
// --------
// options:
//  store: a Substance Store used to persist the index
Chronicle.create = function(options) {
  throw new errors.SubstanceError("Not implemented.");
};

// A directed acyclic graph of Commit instances.
// ========
//
var Index = function() {
  this.__id__ = util.uuid();

  this.changes = {};
  this.refs = {};
  this.children = {};
  this.changes[ROOT] = ROOT_NODE;
  this.children[ROOT] = [];
};

Index.Prototype = function() {

  // Adds a change to the index.
  // --------
  // All parents must be registered first, otherwise throws an error.
  //

  this.add = function(change) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Removes a change from the index
  // --------
  // All children must be removed first, otherwise throws an error.
  //

  this.remove = function(id) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Checks if a given changeId has been added to the index.
  // --------
  //

  this.contains = function(changeId) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Retrieves a (shortest) path between two versions
  // --------
  //
  // If no end change is given it returns the path starting
  // from ROOT to the start change.
  // path() returns the path from ROOT to the current state.
  //

  this.path = function(start, end) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Retrieves a change by id
  // --------
  //

  this.get = function(id) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Provides all changes that are direct successors of this change.
  // --------
  //

  this.getChildren = function(id) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Lists the ids of all contained changes
  // --------
  //

  this.list = function() {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Computes the difference betweend two changes
  // --------
  //
  // In contrast to `path` is a diff a special path that consists
  // of a sequence of reverts followed by a sequence of applies.
  //

  this.diff = function(start, end) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Sets a reference to look up a change via name.
  // ---------
  //

  this.setRef = function(name, id) {
    if (this.changes[id] === undefined) {
      throw new errors.ChronicleError("Unknown change: " + id);
    }
    this.refs[name] = id;
  };

  // Looks-up a change via name.
  // ---------
  //

  this.getRef = function(name) {
    return this.refs[name];
  };

  this.listRefs = function() {
    return Object.keys(this.refs);
  };

  // Imports all commits from another index
  // --------
  //
  // Note: this corresponds to a 'git fetch', which only adds commits without
  // applying any changes.
  //

  this.import = function(otherIndex) {
    throw new errors.SubstanceError("Not implemented.");
  };

};

Index.prototype = new Index.Prototype();

Index.INVALID = "INVALID";
Index.ROOT = ROOT_NODE;

Index.create = function() {
  throw new errors.SubstanceError("Not implemented.");
};

// Creates an adapter for Changes given as plain hash.
// The adapter can be used together with Index.import
Index.adapt = function(changes) {
  return {
    list: function() {
      return _.keys(changes);
    },
    get: function(id) {
      return changes[id];
    }
  };
};

// A interface that must be implemented by objects that should be versioned.
var Versioned = function(chronicle) {
  this.chronicle = chronicle;
  this.state = ROOT;
  chronicle.manage(this);
};

Versioned.Prototype = function() {

  // Applies the given change.
  // --------
  //

  this.apply = function(change) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Reverts the given change.
  // --------
  //

  this.revert = function(change) {
    change = this.invert(change);
    this.apply(change);
  };

  // Inverts a given change
  // --------
  //

  this.invert = function(change) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Transforms two sibling changes.
  // --------
  //
  // This is the `transform` operator provided by Operational Transformation.
  //
  //       / - a            / - a - b' \
  //      o          ~ >   o             p
  //       \ - b            \ - b - a' /
  //
  // I.e., the result of applying `a - b'` must lead to the same result as
  // applying `b - a'`.
  //
  // options:
  //
  //  - check:    enables conflict checking. A MergeConflict is thrown as an error
  //              when a conflict is found during transformation.
  //  - inplace:  transforms the given instances a and b directly, without copying.
  //
  // returns: [a', b']

  this.transform = function(a, b, options) {
    throw new errors.SubstanceError("Not implemented.");
  };

  // Provides the current state.
  // --------
  //

  this.getState = function() {
    return this.state;
  };

  // Sets the state.
  // --------
  //
  // Note: this is necessary for implementing merges.
  //

  this.setState = function(state) {
    this.state = state;
  };

  // Resets the versioned object to a clean state.
  // --------
  //

  this.reset = function() {
    this.state = ROOT;
  };
};

Versioned.prototype = new Versioned.Prototype();

Chronicle.Change = Change;
Chronicle.Merge = Merge;
Chronicle.Transformed = Transformed;
Chronicle.Diff = Diff;
Chronicle.Index = Index;
Chronicle.Versioned = Versioned;
Chronicle.ROOT = ROOT;

Chronicle.mergeConflict = function(a, b) {
  var conflict = new errors.MergeConflict("Merge conflict: " + JSON.stringify(a) +" vs " + JSON.stringify(b));
  conflict.a = a;
  conflict.b = b;
  return conflict;
};

module.exports = Chronicle;

},{"substance-util":127,"underscore":134}],16:[function(require,module,exports){
"use strict";

// Imports
// ====

var _ = require('underscore');
var util = require('substance-util');
var errors = util.errors;
var Chronicle = require('./chronicle');

// Module
// ====

var ChronicleImpl = function(index, options) {
  Chronicle.call(this, index, options);
};

ChronicleImpl.Prototype = function() {

  var __private__ = new ChronicleImpl.__private__();
  var ROOT = Chronicle.Index.ROOT.id;

  this.uuid = util.uuid;
  this.internal_uuid = util.uuid;

  this.record = function(changeData) {
    // Sanity check: the change should have been applied already.
    // Reverting and applying should not fail.
    if ((this.__mode__ & Chronicle.PEDANTIC_RECORD) > 0) {
      this.versioned.revert(changeData);
      this.versioned.apply(changeData);
    }

    // 1. create a new change instance
    var head = this.versioned.getState();
    var id = this.uuid();
    var change = new Chronicle.Change(id, head, changeData);

    // 2. add change to index
    this.index.add(change);

    // 3. shift head
    this.versioned.setState(id);

    return id;
  };

  this.reset = function(id, index) {
    index = index || this.index;

    // the given id must be available
    if (!index.contains(id)) {
      throw new errors.ChronicleError("Invalid argument: unknown change "+id);
    }

    // 1. compute diff between current state and the given id
    var head = this.versioned.getState();
    var path = index.shortestPath(head, id);

    // 2. apply path
    __private__.applySequence.call(this, path, index);
  };

  this.open = this.reset;

  this.path = function(id1, id2) {
    if (!id2) {
      var path = this.index.shortestPath(ROOT, id1 || this.versioned.getState());
      path.shift();
      return path;
    } else {
      if (!id1) throw new errors.ChronicleError("Illegal argument: "+id1);
      return this.index.shortestPath(id1, id2);
    }
  };

  this.apply = function(sha) {
    if (_.isArray(sha)) {
      return __private__.applySequence.call(this, sha);
    } else {
      return __private__.applySequence.call(this, arguments);
    }
  };

  this.step = function(nextId) {
    var index = this.index;
    var originalState = this.versioned.getState();

    try {
      var current = index.get(originalState);

      // tolerate nop-transitions
      if (current.id === nextId) return null;

      var next = index.get(nextId);

      var op;
      if (current.parent === nextId) {
        op = this.versioned.invert(current.data);
      } else if (next.parent === current.id) {
        op = next.data;
      }
      else {
        throw new errors.ChronicleError("Invalid apply sequence: "+nextId+" is not parent or child of "+current.id);
      }

      this.versioned.apply(op);
      this.versioned.setState(nextId);
      return op;

    } catch(err) {
      this.reset(originalState, index);
      throw err;
    }
  };

  this.merge = function(id, strategy, options) {
    // the given id must exist
    if (!this.index.contains(id))
      throw new errors.ChronicleError("Invalid argument: unknown change "+id);

    if(arguments.length == 1) {
      strategy = "auto";
      options = {};
    }

    options = options || {};

    var head = this.versioned.getState();
    var diff = this.index.diff(head, id);

    // 1. check for simple cases

    // 1.1. don't do anything if the other merge is already merged
    if (!diff.hasApplies()) {
      return head;
    }

    // 1.2. check if the merge can be solved by simple applies (so called fast-forward)
    if (!diff.hasReverts() && !options.no_ff) {
      __private__.applyDiff.call(this, diff);
      return this.versioned.getState();
    }

    // 2. create a Merge node
    var change;

    // Strategies:

    // Mine
    if (strategy === "mine") {
      change = new Chronicle.Merge(this.uuid(), head, [head, id]);
    }

    // Theirs
    else if (strategy === "theirs") {
      change = new Chronicle.Merge(this.uuid(), id, [head, id]);
    }

    // Manual
    else if (strategy === "manual") {
      if (!options.sequence) throw new errors.ChronicleError("Invalid argument: sequence is missing for manual merge");
      var sequence = options.sequence;

      change = __private__.manualMerge.call(this, head, id, diff, sequence, options);
    }

    // Unsupported
    else {
      throw new errors.ChronicleError("Unsupported merge strategy: "+strategy);
    }

    // 2. add the change to the index
    this.index.add(change);

    // 3. reset state
    this.reset(change.id);

    return change.id;
  };


  this.import = function(otherIndex) {
    var newIds = this.index.import(otherIndex);
    // sanity check: see if all imported changes can be applied
    if ((this.__mode__ & Chronicle.PEDANTIC_IMPORT) > 0) __private__.importSanityCheck.call(this, newIds);
  };

};

ChronicleImpl.__private__ = function() {

  var __private__ = this;

  // Traversal operations
  // =======

  // a diff is a special kind of path which consists of
  // a sequence of reverts and a sequence of applies.
  this.applyDiff = function(diff, index) {

    index = index || this.index;

    if(!diff) return;

    var originalState = this.versioned.getState();

    // sanity check: don't allow to apply the diff on another change
    if (originalState !== diff.start())
      throw new errors.ChronicleError("Diff can not applied on to this state. Expected: "+diff.start()+", Actual: "+originalState);

    var err = null;
    var successfulReverts = [];
    var successfulApplies = [];
    try {
      var reverts = diff.reverts();
      var applies = diff.applies();

      var idx, id;
      // start at idx 1 as the first is the starting id
      for (idx = 0; idx < reverts.length; idx++) {
        id = reverts[idx];
        __private__.revertTo.call(this, id, index);
        successfulReverts.push(id);
      }
      for (idx = 0; idx < applies.length; idx++) {
        id = applies[idx];
        __private__.apply.call(this, id, index);
        successfulApplies.push(id);
      }
    } catch(_err) {
      err = _err;
    }

    // if the diff could not be applied, revert all changes that have been applied so far
    if (err && (successfulReverts.length > 0 || successfulApplies.length > 0)) {
      // idx shows to the change that has failed;
      var applied = Chronicle.Diff.create(diff.start(), successfulReverts, successfulApplies);
      var inverted = applied.inverted();
      try {
        __private__.applyDiff.call(this, inverted, index);
      } catch(_err) {
        // TODO: maybe we should do that always, instead of minimal rollback?
        console.log("Ohohhhh.... could not rollback partially applied diff.",
          "Without bugs and in HYSTERICAL mode this should not happen.",
          "Resetting to original state");
        this.versioned.reset();
        this.reset(originalState, index);
      }
    }

    if (err) throw err;
  };

  this.applySequence = function(seq, index) {
    index = index || this.index;

    var originalState = this.versioned.getState();

    try {
      var current = index.get(originalState);
      _.each(seq, function(id) {

        // tolerate nop-transitions
        if (current.id === id) return;

        var next = index.get(id);

        // revert
        if (current.parent === id) {
          __private__.revertTo.call(this, id, index);
        }
        // apply
        else if (next.parent === current.id) {
          __private__.apply.call(this, id, index);
        }
        else {
          throw new errors.ChronicleError("Invalid apply sequence: "+id+" is not parent or child of "+current.id);
        }
        current = next;

      }, this);
    } catch(err) {
      this.reset(originalState, index);
      throw err;
    }
  };

  // Performs a single revert step
  // --------

  this.revertTo = function(id, index) {
    index = index || this.index;

    var head = this.versioned.getState();
    var current = index.get(head);

    // sanity checks
    if (!current) throw new errors.ChangeError("Illegal state. 'head' is unknown: "+ head);
    if (current.parent !== id) throw new errors.ChangeError("Can not revert: change is not parent of current");

    // Note: Merge nodes do not have data
    if (current.data) this.versioned.revert(current.data);
    this.versioned.setState(id);
  };

  // Performs a single forward step
  // --------

  this.apply = function(id, index) {
    index = index || this.index;

    var change = index.get(id);

    // sanity check
    if (!change) throw new errors.ChangeError("Illegal argument. change is unknown: "+ id);

    if (change.data) this.versioned.apply(change.data);
    this.versioned.setState(id);
  };

  // Restructuring operations
  // =======

  // Eliminates a sequence of changes before a given change.
  // --------
  //
  // A new branch with transformed changes is created.
  //
  //      0 - a  - b  - c  - d
  //
  //    > c' = eliminate(c, [b,a])
  //
  //      0 - a  - b  - c  - d
  //      |
  //       \- c' - d'
  //
  // The sequence should be in descending order.
  //
  // Returns the id of the rebased change.
  //

  this.eliminate = function(start, del, mapping, index, selection) {
    if (!(index instanceof Chronicle.TmpIndex)) {
      throw new errors.ChronicleError("'eliminate' must be called on a TmpIndex instance");
    }

    var left = index.get(del);
    var right = index.get(start);
    var inverted, rebased;

    // attach the inversion of the first to the first node
    inverted = new Chronicle.Change(this.internal_uuid(), del, this.versioned.invert(left.data));
    index.add(inverted);

    // rebase onto the inverted change
    // Note: basicially this can fail due to broken dependencies of changes
    // However, we do not want to have any conflict management in this case
    // and fail with error instead
    rebased = __private__.rebase0.call(this, inverted.id, right.id, mapping, index, selection, true);

    // as we know that we have eliminated the effect by directly applying
    // a change and its inverse, it is ok to directly skip those two changes at all
    index.reconnect(rebased, left.parent);

    // continue with the transformed version
    right = index.get(rebased);

    return right.id;
  };

  // Performs a basic rebase operation.
  // --------
  //
  // The target and source must be siblings
  //
  //        0 - a
  //        |
  //         \- b - c
  //
  //    > b' = rebase0(a, b)
  //
  //        0 - a  - b' - c'
  //        |
  //         \- b - c
  //
  // The original changes remain.
  // A mapping is created to allow looking up rebased changes via their original ids.

  this.rebase0 = function(targetId, sourceId, mapping, index, selection, check) {
    index = index || this.index;

    var target = index.get(targetId);
    var source = index.get(sourceId);

    if (target.parent !== source.parent) {
      throw new errors.ChronicleError("Illegal arguments: principal rebase can only be applied on siblings.");
    }

    // recursively transform the sub-graph
    var queue = [[target.data, target.id, source]];

    var item;
    var a, b, b_i;
    var result = null;


    // keep merge nodes to update the mapped branches afterwards
    var merges = [];
    var idx;

    while(queue.length > 0) {
      item = queue.pop();

      a = item[0];
      targetId = item[1];
      source = item[2];
      b = source.data;

      var transformed;

      if (source instanceof Chronicle.Merge) {
        // no transformation necessary here
        // propagating the current transformation
        transformed = [a];
        // inserting the original branch ids here, which will be resolved to the transformed ids
        // afterwards, when we can be sure, that all other node have been transformed.
        b_i = new Chronicle.Merge(this.uuid(), targetId, source.branches);
        merges.push(b_i);
      } else {
        // perform the operational transformation
        // TODO: make checking configurable?
        transformed = this.versioned.transform(a, b, {check: check});

        // add a change the with the rebased/transformed operation
        var orig = (source instanceof Chronicle.Transformed) ? source.original : source.id;
        b_i = new Chronicle.Transformed(this.internal_uuid(), targetId, transformed[1], orig);

        // overwrite the mapping for the original
        mapping[orig] = b_i.id;
      }

      // record a mapping between old and new nodes
      mapping[source.id] = b_i.id;

      if (!result) result = b_i;
      index.add(b_i);

      // add children to iteration
      var children = index.getChildren(source.id);
      for (idx = 0; idx < children.length; idx++) {
        var child = index.get(children[idx]);

        // only rebase selected children if a selection is given
        if (selection) {
          var c = (child instanceof Chronicle.Transformed) ? child.original : child.id;
          if (!selection[c]) continue;
        }

        queue.unshift([transformed[0], b_i.id, child]);
      }
    }

    // resolve the transformed branch ids in all occurred merge nodes.
    for (idx = 0; idx < merges.length; idx++) {
      var m = merges[idx];
      var mapped_branches = [];
      for (var idx2 = 0; idx2 < m.branches.length; idx2++) {
        mapped_branches.push(mapping[m.branches[idx2]]);
      }
      m.branches = mapped_branches;
    }

    return result.id;
  };

  // Merge implementations
  // =======

  // Creates a branch containing only the selected changes
  // --------
  // this is part of the merge
  this.eliminateToSelection = function(branch, sequence, mapping, index) {
    var tmp_index = new Chronicle.TmpIndex(index);

    var selection = _.intersection(branch, sequence);
    if (selection.length === 0) return null;

    var eliminations = _.difference(branch, sequence).reverse();
    if (eliminations.length === 0) return mapping[selection[0]];

    var idx1 = 0, idx2 = 0;
    var idx, id, del;
    var last = null;

    while (idx1 < branch.length && idx2 < eliminations.length) {
      id = branch[branch.length-1-idx1];
      del = eliminations[idx2];

      if (id === del) {
        // update the selected change
        if (last) {
          // TODO: filter propagations to nodes that are within the selection (or resolve to)
          last = __private__.eliminate.call(this, last, id, mapping, tmp_index, mapping);
        }
        idx1++; idx2++;
      } else {
        last = id;
        idx1++;
      }
    }

    // store the transformed selected changes to the parent index
    for (idx = 0; idx < selection.length; idx++) {
      id = selection[idx];
      tmp_index.save(mapping[id]);
    }

    return mapping[selection[0]];
  };

  this.manualMerge = function(head, id, diff, sequence, options) {

      if (sequence.length === 0) {
        throw new errors.ChronicleError("Nothing selected for merge.");
      }

      // accept only those selected which are actually part of the two branches
      var tmp = _.intersection(sequence, diff.sequence());
      if (tmp.length !== sequence.length) {
        throw new errors.ChronicleError("Illegal merge selection: contains changes that are not contained in the merged branches.");
      }

      // The given sequence is constructed introducing new (hidden) changes.
      // This is done in the following way:
      // 1. Creating clean versions of the two branches by eliminating all changes that are not selected
      // 2. TODO Re-order the eliminated versions
      // 3. Zip-merge the temporary branches into the selected one

      var tmp_index = new Chronicle.TmpIndex(this.index);

      // Preparation / Elimination
      // ........

      var mine = diff.mine();
      var theirs = diff.theirs();

      var mapping = _.object(sequence, sequence);
      __private__.eliminateToSelection.call(this, mine, sequence, mapping, tmp_index);
      __private__.eliminateToSelection.call(this, theirs, sequence, mapping, tmp_index);

      // 2. Re-order?
      // TODO: implement this if desired

      // Merge
      // ........

      mine = _.intersection(mine, sequence);
      theirs = _.intersection(theirs, sequence);

      for (var idx = 0; idx < sequence.length; idx++) {
        var nextId = sequence[idx];
        var a, b;

        if(mine.length === 0 || theirs.length === 0) {
          break;
        }

        if (mine[0] === nextId) {
          mine.shift();
          a = mapping[nextId];
          b = mapping[theirs[0]];
        } else if (theirs[0] === nextId) {
          theirs.shift();
          a = mapping[nextId];
          b = mapping[mine[0]];
        } else {
          throw new errors.ChronicleError("Reordering of commmits is not supported.");
        }
        __private__.rebase0.call(this, a, b, mapping, tmp_index, null, !options.force);
      }
      var lastId = mapping[_.last(sequence)];

      // Sanity check
      // ........

      // let's do a sanity check before we save the index changes
      try {
        this.reset(lastId, tmp_index);
      } catch (err) {
        this.reset(head, tmp_index);
        throw err;
      }

      // finally we can write the newly created changes into the parent index
      for (idx=0; idx<sequence.length; idx++) {
        tmp_index.save(mapping[sequence[idx]]);
      }

      return new Chronicle.Merge(this.uuid(), lastId, [head, id]);
  };

  this.importSanityCheck = function(newIds) {
    var head = this.versioned.getState();

    // This is definitely very hysterical: we try to reach
    // every provided change by resetting to it.
    // If this is possible we are sure that every change has been applied
    // and reverted at least once.
    // This is for sure not a minimalistic approach.
    var err = null;
    var idx;
    try {
      for (idx = 0; idx < newIds.length; idx++) {
        this.reset(newIds[idx]);
      }
    } catch (_err) {
      err = _err;
      console.log(err.stack);
    }
    // rollback to original state
    this.reset(head);

    if (err) {
      // remove the changes in reverse order to meet restrictions
      newIds.reverse();
      for (idx = 0; idx < newIds.length; idx++) {
        this.index.remove(newIds[idx]);
      }
      if (err) throw new errors.ChronicleError("Import did not pass sanity check: "+err.toString());
    }
  };

};
ChronicleImpl.Prototype.prototype = Chronicle.prototype;
ChronicleImpl.prototype = new ChronicleImpl.Prototype();

ChronicleImpl.create = function(options) {
  options = options || {};
  var index = Chronicle.Index.create(options);
  return new ChronicleImpl(index, options);
};

module.exports = ChronicleImpl;

},{"./chronicle":15,"substance-util":127,"underscore":134}],17:[function(require,module,exports){
var _ = require("underscore");
var Chronicle = require("./chronicle");

var DiffImpl = function(data) {
  this.data = data;
};

DiffImpl.Prototype = function() {

  this.reverts = function() {
    return this.data[1].slice(1, this.data[0]+1);
  };

  this.applies = function() {
    return this.data[1].slice(this.data[0]+1);
  };

  this.hasReverts = function() {
    return this.data[0]>0;
  };

  this.hasApplies = function() {
    return this.data[1].length-1-this.data[0] > 0;
  };

  this.start = function() {
    return this.data[1][0];
  };

  this.end = function() {
    return _.last(this.data[1]);
  };

  this.root = function() {
    return this.data[1][this.data[0]];
  };

  this.sequence = function() {
    return this.data[1].slice(0);
  };

  this.mine = function() {
    return this.data[1].slice(0, this.data[0]).reverse();
  };

  this.theirs = function() {
    return this.applies();
  };

  this.inverted = function() {
    return new DiffImpl([this.data[1].length-1-this.data[0], this.data[1].slice(0).reverse()]);
  };

  this.toJSON = function() {
    return {
      data: this.data
    };
  };
};

DiffImpl.Prototype.prototype = Chronicle.Diff.prototype;
DiffImpl.prototype = new DiffImpl.Prototype();

DiffImpl.create = function(id, reverts, applies) {
  return new DiffImpl([reverts.length, [id].concat(reverts).concat(applies)]);
};

module.exports = DiffImpl;

},{"./chronicle":15,"underscore":134}],18:[function(require,module,exports){
"use strict";

// Imports
// ====

var _ = require('underscore');
var util = require('substance-util');
var errors = util.errors;
var Chronicle = require('./chronicle');

// Module
// ====

var IndexImpl = function() {
  Chronicle.Index.call(this);
};

IndexImpl.Prototype = function() {

  var __private__ = new IndexImpl.__private__();
  var ROOT = Chronicle.ROOT;

  this.add = function(change) {
    // making the change data read-only
    change.data = util.freeze(change.data);

    var id = change.id;

    // sanity check: parents must
    if (!change.parent) throw new errors.ChronicleError("Change does not have a parent.");

    if (!this.contains(change.parent))
      throw new errors.ChronicleError("Illegal change: parent is unknown - change=" + id + ", parent=" + change.parent);

    this.changes[id] = change;
    this.children[id] = [];

    if (!this.children[change.parent]) this.children[change.parent] = [];
    this.children[change.parent].push(id);
  };

  this.remove = function(id) {
    if (this.children[id].length > 0)
      throw new errors.ChronicleError("Can not remove: other changes depend on it.");

    var change = this.changes[id];

    delete this.changes[id];
    delete this.children[id];
    this.children[change.parent] = _.without(this.children[change.parent], id);
  };

  this.contains = function(id) {
    return !!this.changes[id];
  };

  this.get = function(id) {
    return this.changes[id];
  };

  this.list = function() {
    return _.keys(this.changes);
  };

  this.getChildren = function(id) {
    return this.children[id];
  };

  this.diff = function(start, end) {

    // takes the path from both ends to the root
    // and finds the first common change

    var path1 = __private__.getPathToRoot.call(this, start);
    var path2 = __private__.getPathToRoot.call(this, end);

    var reverts = [];
    var applies = [];

    // create a lookup table for changes contained in the second path
    var tmp = {},
        id, idx;
    for (idx=0; idx < path2.length; idx++) {
      tmp[path2[idx]] = true;
    }

    // Traverses all changes from the first path until a common change is found
    // These changes constitute the reverting part
    for (idx=0; idx < path1.length; idx++) {
      id = path1[idx];
      // The first change is not included in the revert list
      // The common root
      if(idx > 0) reverts.push(id);
      if(tmp[id]) break;
    }

    var root = id;

    // Traverses the second path to the common change
    // These changes constitute the apply part
    for (idx=0; idx < path2.length; idx++) {
      id = path2[idx];
      if (id === root || id === ROOT) break;
      // Note: we are traversing from head to root
      // the applies need to be in reverse order
      applies.unshift(id);
    }

    return Chronicle.Diff.create(start, reverts, applies);
  };

  // Computes the shortest path from start to end (without start)
  // --------
  //

  this.shortestPath = function(start, end) {

    // trivial cases
    if (start === end) return [];
    if (end === ROOT) return __private__.getPathToRoot.call(this, start).slice(1);
    if (start === ROOT) return __private__.getPathToRoot.call(this, end).reverse().slice(1);

    // performs a BFS for end.
    var visited = {};
    var queue = [[start, start]];
    var item, origin, pos, current,
        idx, id, children;

    // Note: it is important to

    while(queue.length > 0) {
      item = queue.shift();
      origin = item[0];
      pos = item[1];
      current = this.get(pos);

      if (!visited[pos]) {
        // store the origin to be able to reconstruct the path later
        visited[pos] = origin;

        if (pos === end) {
          // reconstruct the path
          var path = [];
          var tmp;
          while (pos !== start) {
            path.unshift(pos);
            tmp = visited[pos];
            visited[pos] = null;
            pos = tmp;
            if (!pos) throw new errors.SubstanceError("Illegal state: bug in implementation of Index.shortestPath.");
          }
          return path;
        }

        // TODO: we could optimize this a bit if we would check
        // if a parent or a child are the searched node and stop
        // instead of iterating .

        // adding unvisited parent
        if (!visited[current.parent]) queue.push([pos, current.parent]);

        // and all unvisited children
        children = this.getChildren(pos);

        for (idx = 0; idx < children.length; idx++) {
          id = children[idx];
          if(!visited[id]) queue.push([pos, id]);
        }
      }
    }

    throw new errors.SubstanceError("Illegal state: no path found.");
  };

  this.import = function(otherIndex) {
    // 1. index difference (only ids)
    var newIds = _.difference(otherIndex.list(), this.list());
    if (newIds.length === 0) return;

    // 2. compute correct order
    // Note: changes have to added according to their dependencies.
    // I.e., a change can only be added after all parents have been added.
    // OTOH, changes have to be removed in reverse order.
    var order = __private__.computeDependencyOrder.call(this, otherIndex, newIds);

    // now they are topologically sorted
    newIds.sort(function(a,b){ return (order[a] - order[b]); });

    // 2. add changes to the index
    for (var idx = 0; idx < newIds.length; idx++) {
      this.add(otherIndex.get(newIds[idx]));
    }

    return newIds;
  };

  this.foreach = function(iterator, start) {
    start = start || "ROOT";
    var queue = [start];
    var nextId, next;
    while (queue.length > 0) {
      nextId = queue.shift();
      next = this.get(nextId);
      iterator(next);

      var children = this.children[nextId];
      for (var i = 0; i < children.length; i++) {
        queue.push(children[i]);
      }
    }
  };
};

IndexImpl.__private__ = function() {

  var ROOT = Chronicle.ROOT;

  this.getPathToRoot = function(id) {
    var result = [];

    if (id === ROOT) return result;

    var current = this.get(id);
    if(!current) throw new errors.ChronicleError("Unknown change: "+id);

    var parent;
    while(true) {
      result.push(current.id);
      if(current.id === ROOT) break;

      parent = current.parent;
      current = this.get(parent);
    }

    return result;
  };

  // Import helpers
  // =======

  // computes an order on a set of changes
  // so that they can be added to the index,
  // without violating the integrity of the index at any time.
  this.computeDependencyOrder = function(other, newIds) {
    var order = {};

    function _order(id) {
      if (order[id]) return order[id];
      if (id === ROOT) return 0;

      var change = other.get(id);
      var o = _order(change.parent) + 1;
      order[id] = o;

      return o;
    }

    for (var idx = 0; idx < newIds.length; idx++) {
      _order(newIds[idx]);
    }

    return order;
  };

};

IndexImpl.Prototype.prototype = Chronicle.Index.prototype;
IndexImpl.prototype = new IndexImpl.Prototype();



// Extensions
// --------

var makePersistent = function(index, store) {

  index.store = store;
  index.__changes__ = store.hash("changes");
  index.__refs__ = store.hash("refs");

  // Initialize the index with the content loaded from the store

  // Trick: let the changes hash mimic an Index (duck-type)
  // and use Index.import
  index.__changes__.list = index.__changes__.keys;

  // Overrides
  // --------

  var __add__ = index.add;
  index.add = function(change) {
    __add__.call(this, change);
    this.__changes__.set(change.id, change);
  };

  var __remove__ = index.remove;
  index.remove = function(id) {
    __remove__.call(this, id);
    this.__changes__.delete(id);
  };

  var __setRef__ = index.setRef;
  index.setRef = function(name, id) {
    __setRef__.call(this, name, id);
    this.__refs__.set(name, id);
  };

  // Extensions
  // --------

  index.load = function() {
    this.import(this.__changes__);

    _.each(this.__refs__.keys(), function(ref) {
      this.setRef(ref, this.__refs__.get(ref));
    }, this);
  };

  // load automatically?
  index.load();
};

// Export
// ========

IndexImpl.create = function(options) {
  options = options || {};
  var index = new IndexImpl();

  if (options.store) {
    makePersistent(index, options.store);
  }

  return index;
};

module.exports = IndexImpl;

},{"./chronicle":15,"substance-util":127,"underscore":134}],19:[function(require,module,exports){
"use strict";

var util = require('substance-util');
var Chronicle = require('./chronicle');
var TextOperation = require('substance-operator').TextOperation;

var TextOperationAdapter = function(chronicle, doc) {
  Chronicle.Versioned.call(this, chronicle);
  this.doc = doc;
};

TextOperationAdapter.Prototype = function() {

  var __super__ = util.prototype(this);

  this.apply = function(change) {
    this.doc.setText(change.apply(this.doc.getText()));
  };

  this.invert = function(change) {
    return change.invert();
  };

  this.transform = function(a, b, options) {
    return TextOperation.transform(a, b, options);
  };

  this.reset = function() {
    __super__.reset.call(this);
    this.doc.setText("");
  };

};

TextOperationAdapter.Prototype.prototype = Chronicle.Versioned.prototype;
TextOperationAdapter.prototype = new TextOperationAdapter.Prototype();

module.exports = TextOperationAdapter;

},{"./chronicle":15,"substance-operator":118,"substance-util":127}],20:[function(require,module,exports){
var _ = require("underscore");
var util = require("substance-util");
var errors = util.errors;
var IndexImpl = require("./index_impl");


var TmpIndex = function(index) {
  IndexImpl.call(this);
  this.index = index;
};

TmpIndex.Prototype = function() {

  var __super__ = util.prototype(this);

  this.get = function(id) {
    if (__super__.contains.call(this, id)) {
      return __super__.get.call(this, id);
    }
    return this.index.get(id);
  };

  this.contains = function(id) {
    return __super__.contains.call(this, id) || this.index.contains(id);
  };

  this.getChildren = function(id) {
    var result = __super__.getChildren.call(this, id) || [];
    if (this.index.contains(id)) {
      result = result.concat(this.index.getChildren(id));
    }
    return result;
  };

  this.list = function() {
    return __super__.list.call(this).concat(this.index.list());
  };

  this.save = function(id, recurse) {
    if (recurse) {
      var queue = [id];
      var nextId, next;
      while(queue.length > 0) {
        nextId = queue.pop();
        next = this.changes[nextId];

        if (this.changes[nextId]) this.index.add(next);

        for (var idx=0; idx < next.children; idx++) {
          queue.unshift(next.children[idx]);
        }
      }
    } else {
      if (this.changes[id]) this.index.add(this.changes[id]);
    }
  };

  this.reconnect = function(id, newParentId) {
    if (!this.changes[id])
      throw new errors.ChronicleError("Change does not exist to this index.");

    var change = this.get(id);

    if (!this.contains(newParentId)) {
      throw new errors.ChronicleError("Illegal change: parent is unknown parent=" + newParentId);
    }

    if (!this.children[change.parent]) this.children[change.parent] = [];
    this.children[change.parent] = _.without(this.children[change.parent], change.id);

    change.parent = newParentId;

    if (!this.children[change.parent]) this.children[change.parent] = [];
    this.children[change.parent].push(id);
  };
};
TmpIndex.Prototype.prototype = IndexImpl.prototype;
TmpIndex.prototype = new TmpIndex.Prototype();

module.exports = TmpIndex;

},{"./index_impl":18,"substance-util":127,"underscore":134}],21:[function(require,module,exports){
"use strict";

var Data = {};

// Current version of the library. Keep in sync with `package.json`.
Data.VERSION = '0.8.0';

Data.Graph = require('./src/graph');


var _ = require("underscore");
// A helper that is used by Graph node implementations
Data.defineNodeProperties = function(prototype, properties, readonly) {
  _.each(properties, function(name) {
    var spec = {
      get: function() {
        return this.properties[name];
      }
    };
    if (!readonly) {
      spec["set"] = function(val) {
        this.properties[name] = val;
        return this;
      };
    }
    Object.defineProperty(prototype, name, spec);
  });
};

module.exports = Data;

},{"./src/graph":23,"underscore":134}],22:[function(require,module,exports){
"use strict";

var Chronicle = require('substance-chronicle');
var Operator = require('substance-operator');

var ChronicleAdapter = function(graph) {
  this.graph = graph;
  this.graph.state = "ROOT";
};

ChronicleAdapter.Prototype = function() {

  this.apply = function(op) {
    // Note: we call the Graph.apply intentionally, as the chronicled change
    // should be an ObjectOperation
    //console.log("ChronicleAdapter.apply, op=", op);
    this.graph.__apply__(op);
    this.graph.updated_at = new Date(op.timestamp);
  };

  this.invert = function(change) {
    return Operator.ObjectOperation.fromJSON(change).invert();
  };

  this.transform = function(a, b, options) {
    return Operator.ObjectOperation.transform(a, b, options);
  };

  this.reset = function() {
    this.graph.reset();
  };

  this.getState = function() {
    return this.graph.state;
  };

  this.setState = function(state) {
    this.graph.state = state;
  };
};

ChronicleAdapter.Prototype.prototype = Chronicle.Versioned.prototype;
ChronicleAdapter.prototype = new ChronicleAdapter.Prototype();

module.exports = ChronicleAdapter;

},{"substance-chronicle":12,"substance-operator":118}],23:[function(require,module,exports){
"use strict";

var _ = require('underscore');
var util = require('substance-util');
var errors = util.errors;

var Schema = require('./schema');
var Property = require('./property');

var Chronicle = require('substance-chronicle');
var Operator = require('substance-operator');

var PersistenceAdapter = require('./persistence_adapter');
var ChronicleAdapter = require('./chronicle_adapter');
var Index = require('./graph_index');

var GraphError = errors.define("GraphError");

// Data types registry
// -------------------
// Available data types for graph properties.

var VALUE_TYPES = [
  'object',
  'array',
  'string',
  'number',
  'boolean',
  'date'
];


// Check if composite type is in types registry.
// The actual type of a composite type is the first entry
// I.e., ["array", "string"] is an array in first place.
var isValueType = function (type) {
  if (_.isArray(type)) {
    type = type[0];
  }
  return VALUE_TYPES.indexOf(type) >= 0;
};

// Graph
// =====

// A `Graph` can be used for representing arbitrary complex object
// graphs. Relations between objects are expressed through links that
// point to referred objects. Graphs can be traversed in various ways.
// See the testsuite for usage.
//
// Need to be documented:
// @options (mode,seed,chronicle,store,load,graph)
var Graph = function(schema, options) {
  options = options || {};

  // Initialization
  this.schema = new Schema(schema);

  // Check if provided seed conforms to the given schema
  // Only when schema has an id and seed is provided

  if (this.schema.id && options.seed && options.seed.schema) {
    if (!_.isEqual(options.seed.schema, [this.schema.id, this.schema.version])) {
      throw new GraphError([
        "Graph does not conform to schema. Expected: ",
        this.schema.id+"@"+this.schema.version,
        " Actual: ",
        options.seed.schema[0]+"@"+options.seed.schema[1]
      ].join(''));
    }
  }

  this.objectAdapter = new Graph.ObjectAdapter(this);

  this.nodes = {};
  this.indexes = {};

  this.__mode__ = options.mode || Graph.DEFAULT_MODE;
  this.__seed__ = options.seed;

  // Note: don't init automatically after making persistent
  // as this would delete the persistet graph.
  // Instead, the application has to call `graph.load()` if the store is supposed to
  // contain a persisted graph
  this.isVersioned = !!options.chronicle;
  this.isPersistent = !!options.store;

  // Make chronicle graph
  if (this.isVersioned) {
    this.chronicle = options.chronicle;
    this.chronicle.manage(new Graph.ChronicleAdapter(this));
  }

  // Make persistent graph
  if (this.isPersistent) {
    var nodes = options.store.hash("nodes");
    this.__store__ = options.store;
    this.__nodes__ = nodes;

    if (this.isVersioned) {
      this.__version__ = options.store.hash("__version__");
    }

    this.objectAdapter = new PersistenceAdapter(this.objectAdapter, nodes);
  }

  if (options.load) {
    this.load();
  } else {
    this.init();
  }

  // Populate graph
  if (options.graph) this.merge(options.graph);
};

Graph.Prototype = function() {

  _.extend(this, util.Events);

  var _private = new Graph.Private();

  // Graph manipulation API
  // ======================

  // Add a new node
  // --------------
  // Adds a new node to the graph
  // Only properties that are specified in the schema are taken:
  //     var node = {
  //       id: "apple",
  //       type: "fruit",
  //       name: "My Apple",
  //       color: "red",
  //       val: { size: "big" }
  //     };
  // Create new node:
  //     Data.Graph.create(node);
  // Note: graph create operation should reject creation of duplicate nodes.
  //
  // Arguments:
  //   - node: the new node
  //
  this.create = function(node) {
    var op = Operator.ObjectOperation.Create([node.id], node);
    return this.apply(op);
  };

  // Remove a node
  // -------------
  // Removes a node with given id and key (optional):
  //     Data.Graph.delete(this.graph.get('apple'));
  //
  // Arguments:
  //   - id: the node id
  //
  this.delete = function(id) {
    var node = this.get(id);
    if (node === undefined) {
      throw new GraphError("Could not resolve a node with id "+ id);
    }

    // in case that the returned node is a rich object
    // there should be a serialization method
    if (node.toJSON) {
      node = node.toJSON();
    }

    var op = Operator.ObjectOperation.Delete([id], node);
    return this.apply(op);
  };

  // Update the property
  // -------------------
  //
  // Updates the property with a given operation.
  // Note: the diff has to be given as an appropriate operation.
  // E.g., for string properties diff would be Operator.TextOperation,
  // for arrays it would be Operator.ArrayOperation, etc.
  // For example Substance.Operator:
  //   Data.Graph.create({
  //     id: "fruit_2",
  //     type: "fruit",
  //     name: "Blueberry",
  //     val: { form: { kind: "bar", color: "blue" }, size: "small" },
  //   })
  //   var valueUpdate = Operator.TextOperation.fromOT("bar", [1, -1, "e", 1, "ry"]);
  //   var propertyUpdate = Operator.ObjectOperation.Update(["form", "kind"], valueUpdate);
  //   var nodeUpdate = Data.Graph.update(["fruit_2", "val"], propertyUpdate);
  // Let's get it now:
  //   var blueberry = this.graph.get("fruit_2");
  //   console.log(blueberry.val.form.kind);
  //   = > 'berry'
  //
  // Arguments:
  //   - path: an array used to resolve the property to be updated
  //   - diff: an (incremental) operation that should be applied to the property

  this.update = function(path, diff) {
    var prop = this.resolve(path);
    if (!prop) {
      throw new GraphError("Could not resolve property with path "+JSON.stringify(path));
    }

    if (_.isArray(diff)) {
      if (prop.baseType === "string") {
        diff = Operator.TextOperation.fromSequence(prop.get(), diff);
      } else if (prop.baseType === "array") {
        diff = Operator.ArrayOperation.create(prop.get(), diff);
      } else {
        throw new GraphError("There is no convenient notation supported for this type: " + prop.baseType);
      }
    }

    if (!diff) {
      // if the diff turns out to be empty there will be no operation.
      return;
    }

    var op = Operator.ObjectOperation.Update(path, diff, prop.baseType);
    return this.apply(op);
  };

  // Set the property
  // ----------------
  //
  // Sets the property to a given value:
  // Data.Graph.set(["fruit_2", "val", "size"], "too small");
  // Let's see what happened with node:
  //     var blueberry = this.graph.get("fruit_2");
  //     console.log(blueberry.val.size);
  //     = > 'too small'
  //
  // Arguments:
  //   - path: an array used to resolve the property to be updated
  //   - diff: an (incremental) operation that should be applied to the property
  //
  this.set = function(path, newValue) {
    var prop = this.resolve(path);
    if (!prop) {
      throw new GraphError("Could not resolve property with path "+JSON.stringify(path));
    }
    var oldValue = prop.get();
    // Note: Operator.ObjectOperation.Set will clone the values
    var op = Operator.ObjectOperation.Set(path, oldValue, newValue);
    return this.apply(op);
  };

  // Pure graph manipulation
  // -----------------------
  //
  // Only applies the graph operation without triggering e.g., the chronicle.

  this.__apply__ = function(_op) {
    //console.log("Graph.__apply__", op);

    // Note: we apply compounds eagerly... i.e., all listeners will be updated after
    // each atomic change.

    Operator.Helpers.each(_op, function(op) {
      if (!(op instanceof Operator.ObjectOperation)) {
        op = Operator.ObjectOperation.fromJSON(op);
      }
      op.apply(this.objectAdapter);

      this.updated_at = new Date();
      this._internalUpdates(op);

      _.each(this.indexes, function(index) {
        // Treating indexes as first class listeners for graph changes
        index.onGraphChange(op);
      }, this);

      // And all regular listeners in second line
      this.trigger('operation:applied', op, this);
    }, this);

  };

  this._internalUpdates = function(op) {
    // Treating indexes as first class listeners for graph changes
    Operator.Helpers.each(op, function(_op) {
      _.each(this.indexes, function(index) {
        index.onGraphChange(_op);
      }, this);
    }, this);
  };

  // Apply a command
  // ---------------
  //
  // Applies a graph command
  // All commands call this function internally to apply an operation to the graph
  //
  // Arguments:
  //   - op: the operation to be applied,

  this.apply = function(op) {
    this.__apply__(op);

    // do not record changes during initialization
    if (!this.__is_initializing__ && this.isVersioned) {
      op.timestamp = new Date();
      this.chronicle.record(util.clone(op));
    }

    return op;
  };

  // Get the node [property]
  // -----------------------
  //
  // Gets specified graph node using id:
  //  var apple = this.graph.get("apple");
  //  console.log(apple);
  //  =>
  //  {
  //    id: "apple",
  //    type: "fruit",
  //    name: "My Apple",
  //    color: "red",
  //    val: { size: "big" }
  //  }
  // or get node's property:
  //  var apple = this.graph.get(["apple","color"]);
  //  console.log(apple);
  //  => 'red'

  this.get = function(path) {
    if (path === undefined || path === null) {
      throw new GraphError("Invalid argument: provided undefined or null.");
    }
    if (!_.isArray(path) && !_.isString(path)) {
      throw new GraphError("Invalid argument path. Must be String or Array");
    }
    if (_.isString(path)) return this.nodes[path];

    var prop = this.resolve(path);
    return prop.get();
  };

  // Query graph data
  // ----------------
  //
  // Perform smart querying on graph
  //     graph.create({
  //       id: "apple-tree",
  //       type: "tree",
  //       name: "Apple tree"
  //     });
  //     var apple = this.graph.get("apple");
  //     apple.set({["apple","tree"], "apple-tree"});
  // let's perform query:
  //     var result = graph.query(["apple", "tree"]);
  //     console.log(result);
  //     => [{id: "apple-tree", type: "tree", name: "Apple tree"}]

  this.query = function(path) {
    var prop = this.resolve(path);

    var type = prop.type;
    var baseType = prop.baseType;
    var val = prop.get();

    // resolve referenced nodes in array types
    if (baseType === "array") {
      return _private.queryArray.call(this, val, type);
    } else if (!isValueType(baseType)) {
      return this.get(val);
    } else {
      return val;
    }
  };

  // Serialize current state
  // -----------------------
  //
  // Convert current graph state to JSON object

  this.toJSON = function() {
    return {
      id: this.id,
      schema: [this.schema.id, this.schema.version],
      nodes: util.deepclone(this.nodes)
    };
  };

  // Check node existing
  // -------------------
  //
  // Checks if a node with given id exists
  //     this.graph.contains("apple");
  //     => true
  //     this.graph.contains("orange");
  //     => false

  this.contains = function(id) {
    return (!!this.nodes[id]);
  };

  // Resolve a property
  // ------------------
  // Resolves a property with a given path

  this.resolve = function(path) {
    return new Property(this, path);
  };

  // Reset to initial state
  // ----------------------
  // Resets the graph to its initial state.
  // Note: This clears all nodes and calls `init()` which may seed the graph.

  this.reset = function() {
    if (this.isPersistent) {
      if (this.__nodes__) this.__nodes__.clear();
    }

    this.init();

    if (this.isVersioned) {
      this.state = Chronicle.ROOT;
    }

    this.trigger("graph:reset");
  };

  // Graph initialization.
  this.init = function() {
    this.__is_initializing__ = true;

    if (this.__seed__) {
      this.nodes = util.clone(this.__seed__.nodes);
    } else {
      this.nodes = {};
    }

    _.each(this.indexes, function(index) {
      index.reset();
    });

    if (this.isPersistent) {
      _.each(this.nodes, function(node, id) {
        this.__nodes__.set(id, node);
      }, this);
    }

    delete this.__is_initializing__;
  };

  // Merge graphs
  // ------------
  //
  // Merges this graph with another graph:
  //     var folks = new Data.Graph(folks_schema);
  //     var persons = new Data.Graph(persons_schema);
  //     folks.create({
  //       name: 'Bart',
  //       surname: 'Simpson',
  //       type: 'cartoon-actor',
  //       century: 'XXI',
  //       citizen: 'U.S.'
  //     });
  //     persons.create({
  //       name: 'Alexander',
  //       surname: 'Pushkin',
  //       type: 'poet',
  //       century: '19',
  //       citizen: 'Russia'
  //     });
  //     persons.create({
  //       name: 'Pelem Grenwill',
  //       surname: 'Woodhouse',
  //       type: 'poet',
  //       century: '19',
  //       citizen: 'Russia'
  //     });
  //     var merged = persons.merge(folks);
  //     merged.toJSON();
  //     => {
  //       nodes: [
  //         {
  //           name: 'Alexander',
  //           surname: 'Pushkin',
  //           type: 'poet',
  //           century: '19',
  //           citizen: 'Russia'
  //         },
  //         {
  //           name: 'Pelem Grenwill',
  //           surname: 'Woodhouse',
  //           type: 'poet',
  //           century: '19',
  //           citizen: 'Russia'
  //         },
  //         {
  //           name: 'Bart',
  //           surname: 'Simpson',
  //           type: 'cartoon-actor',
  //           century: 'XXI',
  //           citizen: 'U.S.'
  //         }
  //       ]
  //     }

  this.merge = function(graph) {
    _.each(graph.nodes, function(n) {
      this.create(n);
    }, this);

    return this;
  };

  // View Traversal
  // --------------

  this.traverse = function(view) {
    return _.map(this.getView(view), function(node) {
      return this.get(node);
    }, this);
  };

  // Graph loading.
  // ----------
  //
  // Note: currently this must be called explicitely by the app

  this.load = function() {

    if (!this.isPersistent) {
      console.log("Graph is not persistent.");
      return;
    }

    this.__is_initializing__ = true;

    this.nodes = {};
    this.indexes = {};

    // import persistet nodes
    var keys = this.__nodes__.keys();
    for (var idx = 0; idx < keys.length; idx++) {
      _private.create.call(this, this.__nodes__.get(keys[idx]));
    }

    if (this.isVersioned) {
      this.state = this.__version__.get("state") || "ROOT";
    }

    delete this.__is_initializing__;

    return this;
  };

  // A helper to apply co-transformations
  // --------
  //
  // The provided adapter must conform to the interface:
  //
  //    {
  //      create: function(node) {},
  //      delete: function(node) {},
  //      update: function(node, property, newValue, oldValue) {},
  //    }
  //

  this.cotransform = function(adapter, op) {
    if (op.type === "create") {
      adapter.create(op.val);
    }
    else if (op.type === "delete") {
      adapter.delete(op.val);
    }
    // type = 'update' or 'set'
    else {

      var prop = this.resolve(op.path);
      if (prop === undefined) {
        throw new Error("Key error: could not find element for path " + JSON.stringify(op.path));
      }
      var value = prop.get();

      var oldValue;

      // Attention: this happens when updates and deletions are within one compound
      // The operation gets applied, finally the node is deleted.
      // Listeners are triggered afterwards, so they can not rely on the node being there
      // anymore.
      // However, this is not a problem. We can ignore this update as there will come
      // a deletion anyways.
      if (value === undefined) {
        return;
      }

      if (op.type === "set") {
        oldValue = op.original;
      } else {
        var invertedDiff = Operator.Helpers.invert(op.diff, prop.baseType);
        oldValue = invertedDiff.apply(_.clone(value));
      }

      adapter.update(prop.node, prop.key, value, oldValue);
    }
  };

  this.addIndex = function(name, options) {
    if (this.indexes[name]) {
      return this.indexes[name];
      // throw new GraphError("Index with name " + name + "already exists.");
    }
    var index = new Index(this, options);
    this.indexes[name] = index;

    return index;
  };

  this.getIndex = function(name) {
    if (!this.indexes[name]) {
      throw new GraphError("No index available with name:"+name);
    }
    return this.indexes[name];
  };

  this.removeIndex = function(name) {
    delete this.indexes[name];
  };

  this.enableVersioning = function(chronicle) {
    if (this.isVersioned) return;
    if (!chronicle) {
      chronicle = Chronicle.create();
    }
    this.chronicle = chronicle;
    this.chronicle.manage(new Graph.ChronicleAdapter(this));
    this.isVersioned = true;
  };

};

// Index Modes
// ----------

Graph.STRICT_INDEXING = 1 << 1;
Graph.DEFAULT_MODE = Graph.STRICT_INDEXING;


// Private Graph implementation
// ============================

Graph.Private = function() {

  var _private = this;

  // Node construction
  // -----------------
  //
  // Safely constructs a new node based on type information
  // Node needs to have a valid type
  // All properties that are not registered, are dropped
  // All properties that don't have a value are replaced using default values for type

  this.createNode = function (schema, node) {
    if (!node.id || !node.type) {
      throw new GraphError("Can not create Node: 'id' and 'type' are mandatory.");
    }

    var type = schema.type(node.type);
    if (!type) {
      throw new GraphError("Type '"+node.type+"' not found in the schema");
    }

    var properties = schema.properties(node.type);
    var freshNode = { type: node.type, id: node.id };

    // Start constructing the fresh node
    _.each(properties, function(p, key) {
      // Find property base type
      var baseType = schema.propertyBaseType(node.type, key);

      // Assign user defined property value or use default value for baseType
      var val = (node[key] !== undefined) ? node[key] : schema.defaultValue(baseType);
      freshNode[key] = util.deepclone(val);
    });

    return freshNode;
  };

  // Create a new node
  // -----------------
  // Safely constructs a new node
  // Checks for node duplication
  // Adds new node to indexes
  this.create = function(node) {
    var newNode = _private.createNode(this.schema, node);
    if (this.contains(newNode.id)) {
      throw new GraphError("Node already exists: " + newNode.id);
    }
    this.nodes[newNode.id] = newNode;
    this.trigger("node:created", newNode);
    return this;
  };

  // Remove a node
  // -----------
  // Deletes node by id, referenced nodes remain untouched
  // Removes node from indexes
  this.delete = function(node) {
    delete this.nodes[node.id];
    this.trigger("node:deleted", node.id);
  };

  this.set = function(path, value) {
    var property = this.resolve(path);
    if (property === undefined) {
      throw new Error("Key error: could not find element for path " + JSON.stringify(path));
    }
    var oldValue = util.deepclone(property.get());
    property.set(value);
    this.trigger("property:updated", path, null, oldValue, value);
  };

  var _triggerPropertyUpdate = function(path, diff) {
    Operator.Helpers.each(diff, function(op) {
      this.trigger('property:updated', path, op, this);
    }, this);
  };

  this.update = function(path, value, diff) {
    var property = this.resolve(path);
    if (property === undefined) {
      throw new Error("Key error: could not find element for path " + JSON.stringify(path));
    }
    property.set(value);
    _triggerPropertyUpdate.call(this, path, diff);
  };

  this.queryArray = function(arr, type) {
    if (!_.isArray(type)) {
      throw new GraphError("Illegal argument: array types must be specified as ['array'(, 'array')*, <type>]");
    }
    var result, idx;
    if (type[1] === "array") {
      result = [];
      for (idx = 0; idx < arr.length; idx++) {
        result.push(_private.queryArray.call(this, arr[idx], type.slice(1)));
      }
    } else if (!isValueType(type[1])) {
      result = [];
      for (idx = 0; idx < arr.length; idx++) {
        result.push(this.get(arr[idx]));
      }
    } else {
      result = arr;
    }
    return result;
  };

};

Graph.prototype = new Graph.Prototype();

// ObjectOperation Adapter
// ========
//
// This adapter delegates object changes as supported by Operator.ObjectOperation
// to graph methods

Graph.ObjectAdapter = function(graph) {
  this.graph = graph;
};

Graph.ObjectAdapter.Prototype = function() {
  var impl = new Graph.Private();

  // Note: this adapter is used with the OT API only.
  // We do not accept paths to undefined properties
  // and instead throw an error to fail as early as possible.
  this.get = function(path) {
    var prop = this.graph.resolve(path);
    if (prop === undefined) {
      throw new Error("Key error: could not find element for path " + JSON.stringify(path));
    } else {
      return prop.get();
    }
  };

  this.create = function(__, value) {
    // Note: only nodes (top-level) can be created
    impl.create.call(this.graph, value);
  };

  this.set = function(path, value) {
    impl.set.call(this.graph, path, value);
  };

  this.update = function(path, value, diff) {
    impl.update.call(this.graph, path, value, diff);
  };

  this.delete = function(__, value) {
    // Note: only nodes (top-level) can be deleted
    impl.delete.call(this.graph, value);
  };

  this.inplace = function() { return false; };
};

Graph.ObjectAdapter.Prototype.prototype = Operator.ObjectOperation.Object.prototype;
Graph.ObjectAdapter.prototype = new Graph.ObjectAdapter.Prototype();

Graph.Schema = Schema;
Graph.Property = Property;

Graph.PersistenceAdapter = PersistenceAdapter;
Graph.ChronicleAdapter = ChronicleAdapter;
Graph.Index = Index;

// Exports
// ========

module.exports = Graph;

},{"./chronicle_adapter":22,"./graph_index":24,"./persistence_adapter":25,"./property":26,"./schema":27,"substance-chronicle":12,"substance-operator":118,"substance-util":127,"underscore":134}],24:[function(require,module,exports){
var _ = require("underscore");
var util = require("substance-util");

// Creates an index for the document applying a given node filter function
// and grouping using a given key function
// --------
//
// - document: a document instance
// - filter: a function that takes a node and returns true if the node should be indexed
// - key: a function that provides a path for scoped indexing (default: returns empty path)
//

var Index = function(graph, options) {
  options = options || {};

  this.graph = graph;

  this.nodes = {};
  this.scopes = {};

  if (options.filter) {
    this.filter = options.filter;
  } else if (options.types) {
    this.filter = Index.typeFilter(graph.schema, options.types);
  }

  if (options.property) {
    this.property = options.property;
  }

  this.createIndex();
};

Index.Prototype = function() {

  // Resolves a sub-hierarchy of the index via a given path
  // --------
  //

  var _resolve = function(path) {
    var index = this;
    if (path !== null) {
      for (var i = 0; i < path.length; i++) {
        var id = path[i];
        index.scopes[id] = index.scopes[id] || { nodes: {}, scopes: {} };
        index = index.scopes[id];
      }
    }
    return index;
  };

  var _getKey = function(node) {
    if (!this.property) return null;
    var key = node[this.property] ? node[this.property] : null;
    if (_.isString(key)) key = [key];
    return key;
  };

  // Accumulates all indexed children of the given (sub-)index
  var _collect = function(index) {
    var result = _.extend({}, index.nodes);
    _.each(index.scopes, function(child, name) {
      if (name !== "nodes") {
        _.extend(result, _collect(child));
      }
    });
    return result;
  };

  var _add = function(key, node) {
    var index = _resolve.call(this, key);
    index.nodes[node.id] = node.id;
  };

  var _remove = function(key, node) {
    var index = _resolve.call(this, key);
    delete index.nodes[node.id];
  };

  // Keeps the index up-to-date when the graph changes.
  // --------
  //

  this.onGraphChange = function(op) {

    var self = this;

    var adapter = {
      create: function(node) {
        if (!self.filter || self.filter(node)) {
          var key = _getKey.call(self, node);
          _add.call(self, key, node);
        }
      },
      delete: function(node) {
        if (!self.filter || self.filter(node)) {
          var key = _getKey.call(self, node);
          _remove.call(self, key, node);
        }
      },
      update: function(node, property, newValue, oldValue) {
        if ((self.property === property) && (!self.filter || self.filter(node))) {
          var key = oldValue;
          if (_.isString(key)) key = [key];
          _remove.call(self, key, node);
          key = newValue;
          if (_.isString(key)) key = [key];
          _add.call(self, key, node);
        }
      }
    };

    this.graph.cotransform(adapter, op);
  };

  // Initializes the index
  // --------
  //

  this.createIndex = function() {
    this.reset();

    var nodes = this.graph.nodes;
    _.each(nodes, function(node) {
      if (!this.filter || this.filter(node)) {
        var key = _getKey.call(this, node);
        _add.call(this, key, node);
      }
    }, this);
  };

  // Collects all indexed nodes using a given path for scoping
  // --------
  //

  this.get = function(path) {
    if (arguments.length === 0) {
      path = null;
    } else if (_.isString(path)) {
      path = [path];
    }

    var index = _resolve.call(this, path);
    var result;

    // EXPERIMENTAL: do we need the ability to retrieve indexed elements non-recursively
    // for now...
    // if so... we would need an paramater to prevent recursion
    // E.g.:
    //     if (shallow) {
    //       result = index.nodes;
    //     }
    result = _collect(index);

    _.each(result, function(id) {
      result[id] = this.graph.get(id);
    }, this);

    return result;
  };

  this.reset = function() {
    this.nodes = {};
    this.scopes = {};
  };

  this.dispose = function() {
    this.stopListening();
  };
};

Index.prototype = _.extend(new Index.Prototype(), util.Events.Listener);

Index.typeFilter = function(schema, types) {
  return function(node) {
    var typeChain = schema.typeChain(node.type);
    for (var i = 0; i < types.length; i++) {
      if (typeChain.indexOf(types[i]) >= 0) {
        return true;
      }
    }
    return false;
  };
};

module.exports = Index;

},{"substance-util":127,"underscore":134}],25:[function(require,module,exports){
"use strict";

var Operator = require('substance-operator');

var PersistenceAdapter = function(delegate, nodes) {
  this.delegate = delegate;
  this.nodes = nodes;
};

PersistenceAdapter.Prototype = function() {

  this.get = function(path) {
    return this.delegate.get(path);
  };

  this.create = function(__, value) {
    this.delegate.create(__, value);
    this.nodes.set(value.id, value);
  };

  this.set = function(path, value) {
    this.delegate.set(path, value);
    // TODO: is it ok to store the value as node???
    var nodeId = path[0];
    var updated = this.delegate.get([nodeId]);
    this.nodes.set(nodeId, updated);
  };

  this.delete = function(__, value) {
    this.delegate.delete(__, value);
    this.nodes.delete(value.id);
  };

  this.inplace = function() {
    return false;
  };
};
PersistenceAdapter.Prototype.prototype = Operator.ObjectOperation.Object.prototype;
PersistenceAdapter.prototype = new PersistenceAdapter.Prototype();

module.exports = PersistenceAdapter;

},{"substance-operator":118}],26:[function(require,module,exports){
"use strict";

var _ = require("underscore");

var Property = function(graph, path) {
  if (!path) {
    throw new Error("Illegal argument: path is null/undefined.");
  }

  this.graph = graph;
  this.schema = graph.schema;

  // Note: if you specifiy an invalid path, e.g., to a non-existing property
  // then this.resolve() will return `undefined`.
  // In cases of write-access (e.g., update, set) we need to make sure to fail instantly with an error,
  // to avoid entering other more complicated places with an invalid state.
  var resolved = this.resolve(path);
  if (resolved !== undefined) {
    _.extend(this, resolved);
  } else {
    return undefined;
  }
};

Property.Prototype = function() {

  this.resolve = function(path) {
    var node = this.graph;
    var parent = node;
    var type = "graph";

    var key;
    var value;

    var idx = 0;
    for (; idx < path.length; idx++) {

      // TODO: check if the property references a node type
      if (type === "graph" || this.schema.types[type] !== undefined) {
        // remember the last node type
        parent = this.graph.get(path[idx]);

        if (parent === undefined) {
          return undefined;
        }

        node = parent;
        type = this.schema.properties(parent.type);
        value = node;
        key = undefined;
      } else {
        if (parent === undefined) {
          return undefined;
        }
        key = path[idx];
        var propName = path[idx];
        type = type[propName];
        value = parent[key];

        if (idx < path.length-1) {
          parent = parent[propName];
        }
      }
    }

    return {
      node: node,
      parent: parent,
      type: type,
      key: key,
      value: value
    };

  };

  this.get = function() {
    if (this.key !== undefined) {
      return this.parent[this.key];
    } else {
      return this.node;
    }
  };

  this.set = function(value) {
    if (this.key !== undefined) {
      this.parent[this.key] = this.schema.parseValue(this.baseType, value);
    } else {
      throw new Error("'set' is only supported for node properties.");
    }
  };

};
Property.prototype = new Property.Prototype();
Object.defineProperties(Property.prototype, {
  baseType: {
    get: function() {
      if (_.isArray(this.type)) return this.type[0];
      else return this.type;
    }
  },
  path: {
    get: function() {
      return [this.node.id, this.key];
    }
  }
});

module.exports = Property;

},{"underscore":134}],27:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");


// Data.Schema
// ========
//
// Provides a schema inspection API

var Schema = function(schema) {
  _.extend(this, schema);
};

Schema.Prototype = function() {

  // Return Default value for a given type
  // --------
  //

  this.defaultValue = function(valueType) {
    if (valueType === "object") return {};
    if (valueType === "array") return [];
    if (valueType === "string") return "";
    if (valueType === "number") return 0;
    if (valueType === "boolean") return false;
    if (valueType === "date") return new Date();

    return null;
    // throw new Error("Unknown value type: " + valueType);
  };

  // Return type object for a given type id
  // --------
  //

  this.parseValue = function(valueType, value) {
    if (value === null) {
      return value;
    }

    if (_.isString(value)) {
      if (valueType === "object") return JSON.parse(value);
      if (valueType === "array") return JSON.parse(value);
      if (valueType === "string") return value;
      if (valueType === "number") return parseInt(value, 10);
      if (valueType === "boolean") {
        if (value === "true") return true;
        else if (value === "false") return false;
        else throw new Error("Can not parse boolean value from: " + value);
      }
      if (valueType === "date") return new Date(value);

      // all other types must be string compatible ??
      return value;

    } else {
      if (valueType === 'array') {
        if (!_.isArray(value)) {
          throw new Error("Illegal value type: expected array.");
        }
        value = util.deepclone(value);
      }
      else if (valueType === 'string') {
        if (!_.isString(value)) {
          throw new Error("Illegal value type: expected string.");
        }
      }
      else if (valueType === 'object') {
        if (!_.isObject(value)) {
          throw new Error("Illegal value type: expected object.");
        }
        value = util.deepclone(value);
      }
      else if (valueType === 'number') {
        if (!_.isNumber(value)) {
          throw new Error("Illegal value type: expected number.");
        }
      }
      else if (valueType === 'boolean') {
        if (!_.isBoolean(value)) {
          throw new Error("Illegal value type: expected boolean.");
        }
      }
      else if (valueType === 'date') {
        value = new Date(value);
      }
      else {
        throw new Error("Unsupported value type: " + valueType);
      }
      return value;
    }
  };

  // Return type object for a given type id
  // --------
  //

  this.type = function(typeId) {
    return this.types[typeId];
  };

  // For a given type id return the type hierarchy
  // --------
  //
  // => ["base_type", "specific_type"]

  this.typeChain = function(typeId) {
    var type = this.types[typeId];
    if (!type) {
      throw new Error('Type ' + typeId + ' not found in schema');
    }

    var chain = (type.parent) ? this.typeChain(type.parent) : [];
    chain.push(typeId);
    return chain;
  };

  this.isInstanceOf = function(type, parentType) {
    var typeChain = this.typeChain(type);
    if (typeChain && typeChain.indexOf(parentType) >= 0) {
      return true;
    } else {
      return false;
    }
  };

  // Provides the top-most parent type of a given type.
  // --------
  //

  this.baseType = function(typeId) {
    return this.typeChain(typeId)[0];
  };

  // Return all properties for a given type
  // --------
  //

  this.properties = function(type) {
    type = _.isObject(type) ? type : this.type(type);
    var result = (type.parent) ? this.properties(type.parent) : {};
    _.extend(result, type.properties);
    return result;
  };

  // Returns the full type for a given property
  // --------
  //
  // => ["array", "string"]

  this.propertyType = function(type, property) {
    var properties = this.properties(type);
    var propertyType = properties[property];
    if (!propertyType) throw new Error("Property not found for" + type +'.'+property);
    return _.isArray(propertyType) ? propertyType : [propertyType];
  };

  // Returns the base type for a given property
  // --------
  //
  //  ["string"] => "string"
  //  ["array", "string"] => "array"

  this.propertyBaseType = function(type, property) {
    return this.propertyType(type, property)[0];
  };
};

Schema.prototype = new Schema.Prototype();

module.exports = Schema;

},{"substance-util":127,"underscore":134}],28:[function(require,module,exports){
"use strict";

var _ = require("underscore");

var Document = require('./src/document');
Document.Annotator = require('./src/annotator');
Document.Cursor = require('./src/cursor');
Document.Selection = require('./src/selection');
Document.Container = require('./src/container');
Document.Session = require('./src/document_session');

module.exports = Document;

},{"./src/annotator":29,"./src/container":30,"./src/cursor":31,"./src/document":32,"./src/document_session":33,"./src/selection":35,"underscore":134}],29:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var Document = require("./document");
var Operator = require("substance-operator");

var _getConfig;

// A class that provides helpers to manage a document's annotations.
// --------
//
// Note: the provided document is used to retrieve the annotation behavior and to initialize an annotation index.
//
var Annotator = function(doc) {
  this.config = _getConfig(doc);
  doc.addIndex("annotations", {types: ["annotation"], property: "path"});
  this.document = doc;
};

Annotator.Prototype = function() {

  // Updates all annotations according to a given operation.
  // --------
  //
  // The provided operation is an ObjectOperation which has been applied already or should be applied afterwards.
  //
  // Depending on the operation's `path` and the impact on an annotations range
  // there are the following cases:
  // 1. op='update', path==a.path: update the range following the rules given in the configuration
  // 2. op='delete', path[0]==a.path[0]: the annotation gets deleted
  // 3. op='set', path==a.path: the annotation gets deleted as the referenced property has been reset
  //
  this.update = function(op, options) {
    options = options || {};
    var path = options.path || op.path;
    var index = this.document.getIndex("annotations");
    var annotations = index.get(path);
    _.each(annotations, function(a) {
      _update(this, a, op, options);
    }, this);
  };

  // Copy annotations in the given selection.
  // --------
  // This is the pendant to the writer's copy method.
  // Partially selected annotations may not get copied depending on the
  // annotation type, for others, new annotation fragments would be created.

  this.copy = function(/*selection*/) {
    throw new Error("FIXME: this must be updated considering the other API changes.");

    // var ranges = _getRanges(this, selection);

    // // get all affected annotations
    // var annotations = this.getAnnotations(session, selection);
    // var result = [];

    // _.each(annotations, function(annotation) {

    //   // TODO: determine if an annotation would be split by the given selection.
    //   var range = ranges[annotation.path[0]];
    //   var isPartial = (range[0] > annotation.range[0] || range[1] < annotation.range[1]);

    //   var newAnnotation;
    //   if (isPartial) {
    //     // for the others create a new fragment (depending on type) and truncate the original
    //     if (this.isSplittable(annotation.type)) {
    //       newAnnotation = util.clone(annotation);
    //       // make the range relative to the selection
    //       newAnnotation.id = util.uuid();
    //       newAnnotation.range = [Math.max(0, annotation.range[0] - range[0]), annotation.range[1] - range[0]];
    //       result.push(newAnnotation);
    //     }
    //   } else {
    //     // add totally included ones
    //     // TODO: need more control over uuid generation
    //     newAnnotation = util.clone(annotation);
    //     newAnnotation.id = util.uuid();
    //     newAnnotation.range = [newAnnotation.range[0] - range[0], newAnnotation.range[1] - range[0]];
    //     result.push(newAnnotation);
    //   }

    // }, this);

    // return result;
  };

  this.paste = function(/*annotations, newNodeId, offset*/) {
    throw new Error("FIXME: this must be updated considering the other API changes.");
    // for (var i = 0; i < annotations.length; i++) {
    //   var annotation = annotations[i];
    //   if (newNodeId !== undefined) {
    //     annotation.path = _.clone(annotation.path);
    //     annotation.path[0] = newNodeId;
    //   }
    //   if (offset !== undefined) {
    //     annotation.range[0] += offset;
    //     annotation.range[1] += offset;
    //   }
    //   this.create(annotation);
    // }
  };

  // A helper to implement an editor which can breaks or joins nodes.
  // --------
  // TODO: this seems to be very tailored to text nodes. Refactor this when needed.
  //
  this.transferAnnotations = function(node, charPos, newNode, offset) {
    offset = offset || 0;

    var annotations = _nodeAnnotationsByRange(this, node, {start: charPos});
    _.each(annotations, function(annotation) {
    //   var range = ranges[annotation.path[0]];
      var isInside = (charPos > annotation.range[0] || charPos[1] < annotation.range[1]);
      var newRange;

      // 1. if the cursor is inside an annotation it gets either split or truncated
      if (isInside) {
        // create a new annotation fragment if the annotation is splittable
        if (this.isSplittable(annotation.type)) {
          var splitAnnotation = util.clone(annotation);
          splitAnnotation.range = [offset, offset + annotation.range[1] - charPos];
          splitAnnotation.id = util.uuid();
          splitAnnotation.path[0] = newNode.id;
          this.document.create(splitAnnotation);
        }
        // in either cases truncate the first part
        newRange =_.clone(annotation.range);
        newRange[1] = charPos;

        // if the fragment has a zero range now, delete it
        if (newRange[1] === newRange[0]) {
          this.document.delete(annotation.id);
        }
        // ... otherwise update the range
        else {
          this.document.set([annotation.id, "range"], newRange);
        }
      }

      // 2. if the cursor is before an annotation then simply transfer the annotation to the new node
      else {
        // Note: we are preserving the annotation so that anything which is connected to the annotation
        // remains valid.
        var newPath = _.clone(annotation.path);
        newPath[0] = newNode.id;
        this.document.set([annotation.id, "path"], newPath);
        newRange = [offset + annotation.range[0] - charPos, offset + annotation.range[1] - charPos];
        this.document.set([annotation.id, "range"], newRange);
      }
    }, this);
  };

  this.getAnnotationsForNode = function(nodeId) {
    return this.index.get(nodeId);
  };

  // Provides all annotations that correspond to a given selection.
  // --------
  // TODO: we could do a minor optimization, as it happens that the same query is performed multiple times.
  //
  this.getAnnotations = function(sel) {
    if (!(sel instanceof Document.Selection)) {
      throw new Error("API has changed: now getAnnotations() takes only a selection.");
    }

    var annotations = [];
    var ranges = sel.getRanges();
    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var annos = _annotationsByRange(this, this.document, range);
      annotations = annotations.concat(annos);
    }
    // console.log("Annotator.getAnnotations():", sel, annotations);
    return annotations;
  };

  // Returns true if two annotation types are mutually exclusive
  // ---------
  // Currently there is a built-in mechanism which considers two annotations
  // exclusive if they belong to the same group.
  //
  this.isExclusive = function(type1, type2) {
    return this.config.groups[type1] === this.config.groups[type2];
  };

  // Tell if an annotation can be split or should be truncated only.
  // --------
  //
  // E.g. when cutting a selection or inserting a new node existing annotations
  // may be affected. In some cases (e.g., `emphasis` or `strong`) it is wanted
  // that a new annotation of the same type is created for the cut fragment.
  //
  this.isSplittable = function(type) {
    return this.config.split.indexOf(type) >= 0;
  };


  // Updates a single annotation according to a given operation.
  // --------
  //
  var _update = function(self, annotation, op, options) {
    var path = options.path || op.path;

    // only apply the transformation on annotations with the same property
    // Note: currently we only have annotations on the `content` property of nodes
    if (!_.isEqual(annotation.path, path)) return;

    if (op.type === "update") {
      // Note: these are implicit transformations, i.e., not triggered via annotation controls
      var expandLeft = false;
      var expandRight = false;

      var expandSpec = self.config.expansion[annotation.type];
      if (expandSpec) {
        if (expandSpec.left) expandLeft =  expandSpec.left(annotation);
        if (expandSpec.right) expandRight = expandSpec.right(annotation);
      }

      var newRange = util.clone(annotation.range);
      var changed = Operator.TextOperation.Range.transform(newRange, op.diff, expandLeft, expandRight);
      if (changed) {
        if (newRange[0] === newRange[1]) {
          self.document.delete(annotation.id);
        } else {
          self.document.set([annotation.id, "range"], newRange);
        }
      }
    }
    // if somebody has reset the property we must delete the annotation
    else if (op.type === "delete" || op.type === "set") {
      self.document.delete(annotation.id);
    }
  };

  // Checks if an annotation overlaps with a given range
  // --------
  //
  var __isOverlap = function(self, anno, range) {
    var sStart = range.start;
    var sEnd = range.end;
    var aStart = anno.range[0];
    var aEnd = anno.range[1];

    var expandLeft = false;
    var expandRight = false;
    var expandSpec = self.config.expansion[anno.type];
    if (expandSpec) {
      if (expandSpec.left) expandLeft =  expandSpec.left(anno);
      if (expandSpec.right) expandRight = expandSpec.right(anno);
    }

    var overlap;
    if (expandRight) {
      overlap = (aEnd >= sStart);
    } else {
      overlap = (aEnd > sStart);
    }

    // Note: it is allowed to leave range.end undefined
    if (_.isNumber(sEnd)) {
      if (expandLeft) {
        overlap &= (aStart <= sEnd);
      } else {
        overlap &= (aStart < sEnd);
      }
    }

    return overlap;
  };

  var _annotationsByRange = function(self, doc, range) {
    var result = [];
    var component = range.component;
    var annotations;
    var index = doc.getIndex("annotations");

    if (component.type === "node") {
      var node = component.node;
      annotations = index.get(node.id);
    }
    else if (component.type === "property") {
      // Note: If a component displays a referenced property (e.g., Cover.title)
      // IMO it makes more sense to attach annotations to the referencing path instead of the original path.
      // E.g., ["cover", "title"] instead of ["document", "title"]
      //annotations = index.get(component.propertyPath);
      annotations = index.get(component.path);
    }
    else if (component.type === "custom") {
      annotations = index.get(component.path);
    }
    else {
      console.error("FIXME");
    }
    _.each(annotations, function(a) {
      if (__isOverlap(self, a, range)) {
        result.push(a);
      }
    });
    return result;
  };

  var _nodeAnnotationsByRange = function(self, node, range) {
    var result = [];
    var index = self.document.getIndex("annotations");
    var annotations = index.get(node.id);
    _.each(annotations, function(a) {
      if (__isOverlap(self, a, range)) {
        result.push(a);
      }
    });
    return result;
  };
};

Annotator.Prototype.prototype = util.Events;
Annotator.prototype = new Annotator.Prototype();

Annotator.isOnNodeStart = function(a) {
  return a.range[0] === 0;
};

Annotator.isTrue = function() {
  return true;
};

// A helper to decide whether a graph operation affects annotations of a given node
// --------
// E.g., this is used by node views to detect annotation changes and to update the view accordingly.
//

var _isInstanceOf = function(doc, node, type) {
  var schema = doc.getSchema();
  return schema.isInstanceOf(node.type, type);
};


Annotator.changesAnnotations = function(doc, op, path) {
  var anno;
  if (op.type === "delete") {
    anno = op.val;
  } else {
    anno = doc.get(op.path[0]);
  }
  var result = false;

  if (_isInstanceOf(doc, anno, "annotation")) {
    // any annotation operation with appropriate path
    if (_.isEqual(path, anno.path)) {
      result = true;
    }
    // ... or those who are changing the path to that
    else if (op.type === "set" && op.path[1] === "path" && (_.isEqual(path, op.original)|| _.isEqual(path, op.val))) {
      result = true;
    }
  }

  return result;
};

// A static helper to create a document index for annotations
Annotator.createIndex = function(doc) {
  return doc.addIndex("annotations", {types: ["annotation"], property: "path"});
};

_getConfig = function(doc) {
  // Note: this is rather experimental
  // It is important to inverse the control over the annotation behavior,
  // i.e., which annotations exist and how they should be handled
  // This approach makes use of the static context of a Document implementation (e.g., Substance.Article)
  // For this to work you need to have:
  // - the `constructor` property set on the class
  // - a static property `annotationBehavior` specifying the behavior
  //   according to `Annotator.defaultBehavior`
  var annotationBehavior = doc.getAnnotationBehavior();
  if (!annotationBehavior) {
    throw new Error("No Annotation behavior specified.");
  }
  return annotationBehavior;
};

module.exports = Annotator;

},{"./document":32,"substance-operator":118,"substance-util":127,"underscore":134}],30:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");

var util = require("substance-util");
var errors = util.errors;
var ContainerError = errors.define("ContainerError");

// The container must be much more view oriented as the actual visualized components depend very much on the
// used renderers.

var Container = function(document, name, surfaces) {
  this.document = document;
  this.name = name;

  var container = this.document.get(name);
  if (!container || container.type !== "view") {
    throw new ContainerError("Illegal argument: no view with name " + name);
  }

  // TODO: rename this.view to this.node, which is less confusing
  this.view = container;
  this.__components = null;
  this.__roots = null;
  this.__children = null;
  this.__updater = null;

  this.surfaces = surfaces || new Container.DefaultNodeSurfaceProvider(document);
  this.rebuild();

  this.listenTo(this.document, "operation:applied", this.update);
};

Container.Prototype = function() {

  _.extend(this, util.Events);

  this.rebuild = function() {
    var __components = [];
    var __roots = [];
    var __children = {};
    var __updater = [];
    var view = this.document.get(this.name);

    var rootNodes = view.nodes;

    // TODO: we have a problem with doc-simulation here.
    // Nodes are duplicated for simulation. Not so the references in the components.
    for (var i = 0; i < rootNodes.length; i++) {
      var id = rootNodes[i];
      var nodeSurface = this.surfaces.getNodeSurface(id);
      if (!nodeSurface) {
        throw new ContainerError("Aaaaah! no surface available for node " + id);
      }

      if (nodeSurface.update) {
        __updater.push(nodeSurface.update.bind(nodeSurface));
      }

      var components = nodeSurface.components;
      if (!components) {
        throw new ContainerError("Node Surface did not provide components: " + nodeSurface.node.type);
      }
      __children[id] = [];
      for (var j = 0; j < components.length; j++) {
        var component = _.clone(components[j]);
        component.pos = __components.length;
        component.nodePos = i;
        __children[id].push(component);
        __components.push(component);
        __roots.push(rootNodes[i]);
      }
    }
    this.__components = __components;
    this.__roots = __roots;
    this.__children = __children;
    this.__updater = __updater;
    this.view = view;
  };

  this.getComponents = function() {
    if (!this.__components) {
      this.rebuild();
    }
    return this.__components;
  };

  this.lookup = function(path) {
    var components = this.getComponents();
    for (var i = 0; i < components.length; i++) {
      var component = components[i];
      if (_.isEqual(component.path, path)) {
        return component;
      }
    }

    if (path.length === 1) {
      var id = path[0];
      var roots = this.__roots;
      for (var j = 0; j < roots.length; j++) {
        if (roots[j] === id) {
          return components[j];
        }
      }
    }

    console.error("Could not find a view component for path " + JSON.stringify(path));

    return null;
  };

  this.getNodes = function(idsOnly) {
    var nodeIds = this.view.nodes;
    if (idsOnly) {
      return _.clone(nodeIds);
    }
    else {
      var result = [];
      for (var i = 0; i < nodeIds.length; i++) {
        result.push(this.document.get(nodeIds[i]));
      }
      return result;
    }
  };

  this.update = function(op) {
    var path = op.path;
    var needRebuild = (!this.__components || path[0] === this.view.id);

    // Note: we let the NodeSurfaces in invalidate the container
    // TODO: this could be done more efficiently.
    // This strategy means that every container iterates through all
    // surfaces on *each* graph operation.
    // One way to solve this efficiently would be to add an invalidate()
    // that runs with a timeout=0.
    // This however comes with extra listeners and hard to control order of
    // observer calls.
    if (!needRebuild) {
      for (var i = 0; i < this.__updater.length; i++) {
        if (this.__updater[i](op)) {
          needRebuild = true;
          break;
        }
      }
    }
    if (needRebuild) this.rebuild();
  };

  this.getLength = function(pos) {
    var components = this.getComponents();
    if (pos === undefined) {
      return components.length;
    } else {
      return components[pos].getLength();
    }
  };

  this.getRootNodeFromPos = function(pos) {
    if (!this.__roots) this.rebuild();
    return this.document.get(this.__roots[pos]);
  };

  this.getNodePos = function(pos) {
    if (!this.__roots) this.rebuild();
    var id = this.__roots[pos];
    return this.view.nodes.indexOf(id);
  };

  // TODO: what is this for? Describe the purpose and how it is used
  this.lookupRootNode = function(nodeId) {
    var components = this.getComponents();
    for (var i = 0; i < components.length; i++) {
      var component = components[i];
      switch(component.type) {
      case "node":
        if (component.node.id === nodeId) return this.__roots[i];
        break;
      case "property":
        if (component.path[0] === nodeId) return this.__roots[i];
        break;
      default:
        // throw new Error("Not implemented.");
      }
    }
    console.error("Could not find a root node for the given id:" + nodeId);
    return null;
  };

  this.getComponent = function(pos) {
    var components = this.getComponents();
    return components[pos];
  };

  this.getNodeComponents = function(nodeId) {
    var result = this.__children[nodeId];
    if (!result) {
      throw new ContainerError("Node is not in this container:"+nodeId);
    }
    return result;
  };

  this.dispose = function() {
    this.stopListening();
  };

  // Creates a container for a given document
  // --------
  // This named constructor is used to create Container instance with the
  // same setup (name, surface provider, etc.) for a another document instance.
  // This is particularly used for creating manipulation sessions.
  //
  this.createContainer = function(doc) {
    return new Container(doc, this.name, this.surfaces.createCopy(doc));
  };

};

Container.prototype = _.extend(new Container.Prototype(), util.Events.Listener);

Object.defineProperties(Container.prototype, {
  "id": {
    get: function() { return this.view.id; }
  },
  "type": {
    get: function() { return this.view.type; }
  },
  "nodes": {
    get: function() { return this.view.nodes; },
    set: function(val) { this.view.nodes = val; }
  }
});

Container.DefaultNodeSurfaceProvider = require("./node_surface_provider");
Container.ContainerError = ContainerError;

module.exports = Container;

},{"./node_surface_provider":34,"substance-util":127,"underscore":134}],31:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var errors = util.errors;

var CursorError = errors.define("CursorError");

// Document.Selection.Cursor
// ================
//

var Cursor = function(container, pos, charPos, view) {
  this.container = container;
  this.view = view || 'content';

  this.pos = pos;
  this.charPos = charPos;

  if (pos !== null && !_.isNumber(pos)) {
    throw new CursorError("Illegal argument: expected pos as number");
  }

  if (charPos !== null && !_.isNumber(charPos)) {
    throw new CursorError("Illegal argument: expected charPos as number");
  }
};


Cursor.Prototype = function() {

  this.toJSON = function() {
    return [this.pos, this.charPos];
  };

  this.copy = function() {
    return new Cursor(this.container, this.pos, this.charPos, this.view);
  };

  this.isValid = function() {
    if (this.pos === null || this.charPos === null) return false;
    if (this.pos < 0 || this.charPos < 0) return false;

    var l = this.container.getLength(this.pos);
    if (this.charPos >= l) return false;

    return true;
  };

  this.isRightBound = function() {
    return this.charPos === this.container.getLength(this.pos);
  };

  this.isLeftBound = function() {
    return this.charPos === 0;
  };

  this.isEndOfDocument = function() {
    return this.isRightBound() && this.pos === this.container.getLength()-1;
  };

  this.isBeginOfDocument = function() {
    return this.isLeftBound() && this.pos === 0;
  };

  // Return previous node boundary for a given node/character position
  // --------
  //

  this.prevNode = function() {
    if (!this.isLeftBound()) {
      this.charPos = 0;
    } else if (this.pos > 0) {
      this.pos -= 1;
      this.charPos = this.container.getLength(this.pos);
    }
  };

  // Return next node boundary for a given node/character position
  // --------
  //

  this.nextNode = function() {
    if (!this.isRightBound()) {
      this.charPos = this.container.getLength(this.pos);
    } else if (this.pos < this.container.getLength()-1) {
      this.pos += 1;
      this.charPos = 0;
    }
  };

  // Return previous occuring word for a given node/character position
  // --------
  //

  this.prevWord = function() {
    throw new Error("Not implemented");
  };

  // Return next occuring word for a given node/character position
  // --------
  //

  this.nextWord = function() {
    throw new Error("Not implemented");
  };

  // Return next char, for a given node/character position
  // --------
  //
  // Useful when navigating over paragraph boundaries

  this.nextChar = function() {
    // Last char in paragraph
    if (this.isRightBound()) {
      if (this.pos < this.container.getLength()-1) {
        this.pos += 1;
        this.charPos = 0;
      }
    } else {
      this.charPos += 1;
    }
  };


  // Return next char, for a given node/character position
  // --------
  //
  // Useful when navigating over paragraph boundaries

  this.prevChar = function() {
    if (this.charPos<0) throw new CursorError('Invalid char position');

    if (this.isLeftBound()) {
      if (this.pos > 0) {
        this.pos -= 1;
        this.charPos = this.container.getLength(this.pos);
      }
    } else {
      this.charPos -= 1;
    }
  };

  // Move
  // --------
  //
  // Useful helper to find char,word and node boundaries
  //
  //     find('right', 'char');
  //     find('left', 'word');
  //     find('left', 'node');

  this.move = function(direction, granularity) {
    if (direction === "left") {
      if (granularity === "word") {
        this.prevWord();
      } else if (granularity === "char") {
        this.prevChar();
      } else if (granularity === "node") {
        this.prevNode();
      }
    } else {
      if (granularity === "word") {
        this.nextWord();
      } else if (granularity === "char") {
        this.nextChar();
      } else if (granularity === "node") {
        this.nextNode();
      }
    }
  };

  this.set = function(pos, charPos) {
    if (pos !== null && !_.isNumber(pos)) {
      throw new CursorError("Illegal argument: expected pos as number");
    }

    if (charPos !== null && !_.isNumber(charPos)) {
      throw new CursorError("Illegal argument: expected charPos as number");
    }

    if (pos !== null) {
      if(!_.isNumber(pos)) {
        throw new CursorError("Illegal argument: expected pos as number");
      }
      var n = this.container.getLength();
      if (pos < 0 || pos >= n) {
        throw new CursorError("Invalid node position: " + pos);
      }

      var l = this.container.getLength(pos);
      if (charPos < 0 || charPos > l) {
        throw new CursorError("Invalid char position: " + charPos);
      }
    }

    this.pos = pos;
    this.charPos = charPos;
  };

  this.position = function() {
    return [this.pos, this.charPos];
  };
};

Cursor.prototype = new Cursor.Prototype();

module.exports = Cursor;

},{"substance-util":127,"underscore":134}],32:[function(require,module,exports){
"use strict";

// Substance.Document 0.5.0
// (c) 2010-2013 Michael Aufreiter
// Substance.Document may be freely distributed under the MIT license.
// For all details and documentation:
// http://interior.substance.io/modules/document.html


// Import
// ========

var _ = require("underscore");
var util = require("substance-util");
var errors = util.errors;
var Data = require("substance-data");
var Operator = require("substance-operator");
// var Chronicle = require("substance-chronicle");

// Module
// ========

var DocumentError = errors.define("DocumentError");


// Document
// --------
//
// A generic model for representing and transforming digital documents

var Document = function(options) {
  Data.Graph.call(this, options.schema, options);

  // Temporary store for file data
  // Used by File Nodes for storing file contents either as blobs or strings
  this.fileData = {};

  // Index for supplements
  this.addIndex("files", {
    types: ["file"]
  });
};

// Default Document Schema
// --------

Document.schema = {
  // Static indexes
  "indexes": {
  },

  "types": {
    // Specific type for substance documents, holding all content elements
    "content": {
      "properties": {
      }
    },

    "view": {
      "properties": {
        "nodes": ["array", "content"]
      }
    }
  }
};


Document.Prototype = function() {
  var __super__ = util.prototype(this);

  this.getIndex = function(name) {
    return this.indexes[name];
  };

  this.getSchema = function() {
    return this.schema;
  };

  this.create = function(node) {
    __super__.create.call(this, node);
    return this.get(node.id);
  };

  // Delegates to Graph.get but wraps the result in the particular node constructor
  // --------
  //

  this.get = function(path) {
    var node = __super__.get.call(this, path);

    if (!node) return node;

    // Wrap all nodes in an appropriate Node instance
    var nodeSpec = this.nodeTypes[node.type];
    var NodeType = (nodeSpec !== undefined) ? nodeSpec.Model : null;
    if (NodeType && !(node instanceof NodeType)) {
      node = new NodeType(node, this);
      this.nodes[node.id] = node;
    }

    return node;
  };

  // Serialize to JSON
  // --------
  //
  // The command is converted into a sequence of graph commands

  this.toJSON = function() {
    var res = __super__.toJSON.call(this);
    res.id = this.id;
    return res;
  };

  // Hide elements from provided view
  // --------
  //

  this.hide = function(viewId, nodes) {
    var view = this.get(viewId);

    if (!view) {
      throw new DocumentError("Invalid view id: "+ viewId);
    }

    if (_.isString(nodes)) {
      nodes = [nodes];
    }

    var indexes = [];
    _.each(nodes, function(n) {
      var i = view.nodes.indexOf(n);
      if (i>=0) indexes.push(i);
    }, this);

    if (indexes.length === 0) return;

    indexes = indexes.sort().reverse();
    indexes = _.uniq(indexes);

    var ops = _.map(indexes, function(index) {
      return Operator.ArrayOperation.Delete(index, view.nodes[index]);
    });

    var op = Operator.ObjectOperation.Update([viewId, "nodes"], Operator.ArrayOperation.Compound(ops));

    return this.apply(op);
  };

  // HACK: it is not desired to have the comments managed along with the editorially document updates
  // We need an approach with multiple Chronicles instead.
  this.comment = function(comment) {
    var id = util.uuid();
    comment.id = id;
    comment.type = "comment";
    var op = Operator.ObjectOperation.Create([comment.id], comment);
    return this.__apply__(op);
  };

  this.annotate = function(anno, data) {
    anno.id = anno.type + "_" + util.uuid();
    _.extend(anno, data);
    this.create(anno);
  };

  // Adds nodes to a view
  // --------
  //

  this.show = function(viewId, nodes, target) {
    if (target === undefined) target = -1;

    var view = this.get(viewId);
    if (!view) {
      throw new DocumentError("Invalid view id: " + viewId);
    }

    if (_.isString(nodes)) {
      nodes = [nodes];
    }

    var l = view.nodes.length;

    // target index can be given as negative number (as known from python/ruby)
    target = Math.min(target, l);
    if (target<0) target = Math.max(0, l+target+1);

    var ops = [];
    for (var idx = 0; idx < nodes.length; idx++) {
      var nodeId = nodes[idx];
      if (this.nodes[nodeId] === undefined) {
        throw new DocumentError("Invalid node id: " + nodeId);
      }
      ops.push(Operator.ArrayOperation.Insert(target + idx, nodeId));
    }

    if (ops.length > 0) {
      var update = Operator.ObjectOperation.Update([viewId, "nodes"], Operator.ArrayOperation.Compound(ops));
      return this.apply(update);
    }
  };

  // Start simulation, which conforms to a transaction (think databases)
  // --------
  //

  this.startSimulation = function() {
    // TODO: this should be implemented in a more cleaner and efficient way.
    // Though, for now and sake of simplicity done by creating a copy
    var self = this;
    var simulation = this.fromSnapshot(this.toJSON());
    var ops = [];
    simulation.ops = ops;

    var __apply__ = simulation.apply;

    simulation.apply = function(op) {
      ops.push(op);
      op = __apply__.call(simulation, op);
      return op;
    };

    simulation.save = function(data) {
      var _ops = [];
      for (var i = 0; i < ops.length; i++) {
        if (ops[i].type !== "compound") {
          _ops.push(ops[i]);
        } else {
          _ops = _ops.concat(ops[i].ops);
        }
      }
      if (_ops.length === 0) {
        // nothing has been recorded
        return;
      }
      var compound = Operator.ObjectOperation.Compound(_ops);
      if (data) compound.data = _.clone(data);
      self.apply(compound);
    };

    return simulation;
  };

  this.fromSnapshot = function(data, options) {
    return Document.fromSnapshot(data, options);
  };

  this.uuid = function(type) {
    return type + "_" + util.uuid();
  };
};

Document.Prototype.prototype = Data.Graph.prototype;
Document.prototype = new Document.Prototype();

Document.fromSnapshot = function(data, options) {
  options = options || {};
  options.seed = data;
  return new Document(options);
};


Document.DocumentError = DocumentError;

// Export
// ========

module.exports = Document;

},{"substance-data":21,"substance-operator":118,"substance-util":127,"underscore":134}],33:[function(require,module,exports){
"use strict";

var Annotator = require("./annotator");
var Selection = require("./selection");

// DocumentSession
// ========
// A document session bundles
// - `document`: a Document instance,
// - `container`: a Container instance which manages a specific document view node
// - `annotator`: an Annotator instance which provides an API to manage annotations
// - `selection`: a Selection instance which represents a current selection state
//
// Note: as the Container is the most complex instance (e.g., it depends on a SurfaceProvider)
// you have to create it and pass it as an argument to create a session.
//
var DocumentSession = function(container) {
  this.document = container.document;
  this.container = container;
  this.annotator = new Annotator(this.document);
  this.selection = new Selection(this.container);
};

DocumentSession.Prototype = function() {

  // TODO: this is used *very* often and is implemented *very* naive.
  // There's a great potential for optimization here
  this.startSimulation = function() {
    var doc = this.document.startSimulation();
    var annotator = new Annotator(doc);
    var container = this.container.createContainer(doc);
    var sel = new Selection(container, this.selection);
    // Note: we save the old and new selection along with
    // the operation created by the simulation
    var data = {};
    if (!sel.isNull()) {
      data["selBefore"] = sel.toJSON();
    }
    return {
      document: doc,
      view: container.name,
      selection: sel,
      annotator: annotator,
      container: container,
      dispose: function() {
        container.dispose();
      },
      save: function() {
        data["selAfter"] = sel.toJSON();
        doc.save(data);
        this.dispose();
      }
    };
  };

  this.dispose = function(){
    this.container.dispose();
  };

};
DocumentSession.prototype = new DocumentSession.Prototype();

Object.defineProperties(DocumentSession.prototype, {
  "view": {
    get: function() {
      return this.container.name;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  }
});

module.exports = DocumentSession;

},{"./annotator":29,"./selection":35}],34:[function(require,module,exports){
"use strict";

var _ = require("underscore");

var NodeSurfaceProvider = function(doc) {
  this.document = doc;
  this.nodeTypes = this.document.nodeTypes;
  this.nodeSurfaces = {};
};

NodeSurfaceProvider.Prototype = function() {

  this.getNodeSurface = function(node_or_nodeId) {
    var nodeId, node;
    if (_.isString(node_or_nodeId)) {
      nodeId = node_or_nodeId;
    } else {
      node = node_or_nodeId;
      nodeId = node.id;
    }

    if (!this.nodeSurfaces[nodeId]) {
      node = node || this.document.get(nodeId);
      this.nodeSurfaces[nodeId] = this.createNodeSurface(node);
    }

    return this.nodeSurfaces[nodeId];
  };

  this.createNodeSurface = function(node) {
      var nodeSurface;
      if (!node) {
        throw new Error("Unknown node: " + nodeId);
      }

      var NodeSurface = this.nodeTypes[node.type].Surface;
      if (NodeSurface) {
        // Note: passing this provider ot allow nesting/delegation
        nodeSurface = new NodeSurface(node, this);
      } else {
        // console.log("No surface available for node type", node.type,". Using Stub.");
        nodeSurface = new NodeSurfaceProvider.EmptySurface(node);
      }

      return nodeSurface;
  };

  // Creates a copy of this provider for a given document.
  // --------
  // This is as a named constructor for establishing a manipulation simulation session.
  //
  this.createCopy = function(document) {
    // Note: As this method is mainly used to implement document simulations,
    //   we must not copy the node surface instances as they contain a reference
    //   to the actual node.
    return new NodeSurfaceProvider(document);
  };

};
NodeSurfaceProvider.prototype = new NodeSurfaceProvider.Prototype();

NodeSurfaceProvider.EmptySurface = function(node) {
  this.node = node;
  this.view = null;
  this.components = [];
};

module.exports = NodeSurfaceProvider;

},{"underscore":134}],35:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("substance-util");
var errors = util.errors;
var Cursor = require("./cursor");

var SelectionError = errors.define("SelectionError");

// Document.Selection
// ================
//
// A selection refers to a sub-fragment of a Substance.Document. It holds
// start/end positions for node and character offsets as well as a direction.
//
//     {
//       start: [NODE_POS, CHAR_POS]
//       end: [NODE_POS, CHAR_POS]
//       direction: "left"|"right"
//     }
//
// NODE_POS: Node offset in the document (0 = first node)
// CHAR_POS: Character offset within a textnode (0 = first char)
//
// Example
// --------
//
// Consider a document `doc` consisting of 3 paragraphs.
//
//           0 1 2 3 4 5 6
//     -------------------
//     P0  | a b c d e f g
//     -------------------
//     P1: | h i j k l m n
//     -------------------
//     P2: | o p q r s t u
//
//
// Create a selection operating on that document.
//     var sel = new Substance.Document.Selection(container);
//
//     sel.set({
//       start: [0, 4],
//       end: [1, 2],
//       direction: "right"
//     });
//
// This call results in the following selection:
//
//           0 1 2 3 4 5 6
//     -------------------
//     P0  | a b c d > > >
//     -------------------
//     P1: | > > > k l m n
//     -------------------
//     P2: | o p q r s t u
//

var Selection = function(container, selection) {
  this.container = container;

  this.start = null;
  this.__cursor = new Cursor(container, null, null);

  if (selection) this.set(selection);
};

Selection.Prototype = function() {

  // Get node from position in contnet view
  // --------
  //

  this.copy = function() {
    var copy = new Selection(this.container);
    if (!this.isNull()) copy.set(this);
    return copy;
  };


  // Set selection
  // --------
  //
  // sel: an instanceof Selection
  //      or a document range `{start: [pos, charPos], end: [pos, charPos]}`
  //      or a document position `[pos, charPos]`

  this.set = function(sel) {
    var cursor = this.__cursor;

    if (sel instanceof Selection) {
      this.start = _.clone(sel.start);
      cursor.set(sel.__cursor.pos, sel.__cursor.charPos);
    } else if (_.isArray(sel)) {
      this.start = _.clone(sel);
      cursor.set(sel[0], sel[1]);
    } else {
      this.start = _.clone(sel.start);
      cursor.set(sel.end[0], sel.end[1]);
    }
    var start = this.start;

    // being hysterical about the integrity of selections
    var n = this.container.getLength();
    if (start[0] < 0 || start[0] >= n) {
      throw new SelectionError("Invalid node position: " + start[0]);
    }
    var l = this.container.getLength(start[0]);
    if (start[1] < 0 || start[1] > l) {
      throw new SelectionError("Invalid char position: " + start[1]);
    }

    this.trigger('selection:changed', this.range());
    return this;
  };

  this.clear = function() {
    this.start = null;
    this.__cursor.set(null, null);
    this.trigger('selection:changed', null);
  };

  this.range = function() {
    if (this.isNull()) return null;

    var pos1 = this.start;
    var pos2 = this.__cursor.position();

    if (this.isReverse()) {
      return {
        start: pos2,
        end: pos1
      };
    } else {
      return {
        start: pos1,
        end: pos2
      };
    }
  };

  this.isReverse = function() {
    var cursor = this.__cursor;
    return (cursor.pos < this.start[0]) || (cursor.pos === this.start[0] && cursor.charPos < this.start[1]);
  };

  // Set cursor to position
  // --------
  //
  // Convenience for placing the single cusor where start=end

  this.setCursor = function(pos) {
    this.__cursor.set(pos[0], pos[1]);
    this.start = pos;
    return this;
  };

  // Get the selection's  cursor
  // --------
  //

  this.getCursor = function() {
    return this.__cursor.copy();
  };

  this.getCursorPosition = function() {
    return [this.__cursor.pos, this.__cursor.charPos];
  };

  // Fully selects a the node with the given id
  // --------
  //

  this.selectNode = function(nodeId) {
    var components = this.container.getNodeComponents(nodeId);

    var first = components[0];
    var last = components[components.length-1];

    var l = this.container.getLength(last.pos);
    this.set({
      start: [first.pos, 0],
      end: [last.pos, l]
    });
  };

  // Get predecessor node of a given node pos
  // --------
  //

  this.getPredecessor = function() {
    // NOTE: this can not be fixed as now the container can have components that are not nodes
    throw new Error("Not supported anymore");
  };

  // Get successor node of a given node pos
  // --------
  //

  this.getSuccessor = function() {
    // Can not be fixed.
    throw new Error("Not supported anymore");
  };

  // Check if the given position has a successor
  // --------
  //

  // TODO: is this really necessary? ~> document.hasPredecessor
  this.hasPredecessor = function(pos) {
    return pos > 0;
  };

  // Check if the given node has a successor
  // --------
  //

  // TODO: is this really necessary? ~> document.hasSuccessor
  this.hasSuccessor = function(pos) {
    var l = this.container.getLength();
    return pos < l-1;
  };


  // Collapses the selection into a given direction
  // --------
  //

  this.collapse = function(direction) {
    if (direction !== "right" && direction !== "left" && direction !== "start" && direction !== "cursor") {
      throw new SelectionError("Invalid direction: " + direction);
    }

    if (this.isCollapsed() || this.isNull()) return;

    if (direction === "start") {
      this.__cursor.set(this.start[0], this.start[1]);

    } else if (direction === "cursor") {
      this.start[0] = this.__cursor.pos;
      this.start[1] = this.__cursor.charPos;

    } else {
      var range = this.range();

      if (this.isReverse()) {
        if (direction === 'left') {
          this.start = range.start;
        } else {
          this.__cursor.set(range.end[0], range.end[1]);
        }
      } else {
        if (direction === 'left') {
          this.__cursor.set(range.start[0], range.start[1]);
        } else {
          this.start = range.end;
        }
      }
    }

    this.trigger('selection:changed', this.range());
  };

  // move selection to position
  // --------
  //
  // Convenience for placing the single cusor where start=end

  this.move = function(direction, granularity) {

    // moving an expanded selection by char collapses the selection
    // and sets the cursor to the boundary of the direction
    if (!this.isCollapsed() && granularity === "char") {
      this.collapse(direction);
    }
    // otherwise the cursor gets moved (together with start)
    else {
      this.__cursor.move(direction, granularity);
      this.start = this.__cursor.position();
    }

    this.trigger('selection:changed', this.range());
  };

  // Expand current selection
  // ---------
  //
  // Selections keep the direction as a state
  // They can either be right-bound or left-bound
  //

  this.expand = function(direction, granularity) {
    // expanding is done by moving the cursor
    this.__cursor.move(direction, granularity);

    this.trigger('selection:changed', this.range());
  };

  // JSON serialization
  // --------
  //

  this.toJSON = function() {
    var data = null;

    if (!this.isNull()) {
      if (this.isCollapsed()) {
        data = this.__cursor.toJSON();
      } else {
        data = {
          start: _.clone(this.start),
          end: this.__cursor.toJSON()
        }
      }
    }

    return data;
  };

  // For a given document return the selected nodes
  // --------
  //

  this.getNodes = function() {
    throw new Error("This method has been removed, as it is not valid anymore after the Container refactor.");
    // var allNodes = this.container.getNodes();
    // if (this.isNull()) return [];
    // var range = this.range();

    // return allNodes.slice(range.start[0], range.end[0]+1);
  };

  // Derives Range objects for the selection
  // --------
  //

  this.getRanges = function() {
    if (this.isNull()) return [];

    var ranges = [];
    var sel = this.range();

    for (var i = sel.start[0]; i <= sel.end[0]; i++) {
      var startChar = 0;
      var endChar = null;

      // in the first node search only in the trailing part
      if (i === sel.start[0]) {
        startChar = sel.start[1];
      }

      // in the last node search only in the leading part
      if (i === sel.end[0]) {
        endChar = sel.end[1];
      }

      if (!_.isNumber(endChar)) {
        endChar = this.container.getLength(i);
      }
      ranges.push(new Selection.Range(this, i, startChar, endChar));
    }
    return ranges;
  };

  // Returns start node offset
  // --------
  //

  this.startNode = function() {
    return this.isReverse() ? this.__cursor.pos : this.start[0];
  };

  // Returns end node offset
  // --------
  //

  this.endNode = function() {
    return this.isReverse() ? this.start[0] : this.__cursor.pos;
  };


  // Returns start node offset
  // --------
  //

  this.startChar = function() {
    return this.isReverse() ? this.__cursor.charPos : this.start[1];
  };

  // Returns end node offset
  // --------
  //

  this.endChar = function() {
    return this.isReverse() ? this.start[1] : this.__cursor.charPos;
  };

  // No selection
  // --------
  //
  // Returns true if there's just a single cursor not a selection spanning
  // over 1+ characters

  this.isNull = function() {
    return this.start === null;
  };


  // Collapsed
  // --------
  //
  // Returns true if there's just a single cursor not a selection spanning
  // over 1+ characters

  this.isCollapsed = function() {
    return this.start[0] === this.__cursor.pos && this.start[1] === this.__cursor.charPos;
  };


  // Multinode
  // --------
  //
  // Returns true if the selection refers to multiple nodes

  this.hasMultipleNodes = function() {
    return !this.isNull() && (this.startNode() !== this.endNode());
  };

};

Selection.Prototype.prototype = util.Events;
Selection.prototype = new Selection.Prototype();

Object.defineProperties(Selection.prototype, {
  cursor: {
    get: function() {
      return this.__cursor.copy();
    },
    set: function() { throw "immutable property"; }
  }
});

// Document.Selection.Range
// ================
//
// A Document.Selection consists of 1..n Ranges
// Each range belongs to a node in the document
// This allows us to ask the range about the selected text
// or ask if it's partially selected or not
// For example if an image is fully selected we can just delete it

var Range = function(selection, pos, start, end) {
  this.selection = selection;
  // The node pos within the document which can range
  // between selection.startNode() and selection.endNode()
  this.pos = pos;
  this.start = start;
  this.end = end;

  this.component = selection.container.getComponent(pos);
};

Range.Prototype = function() {

  // Returns true if the range denotes the first range in a selection
  // --------
  //

  this.isFirst = function() {
    return this.pos === this.selection.startNode();
  };

  // Returns true if the range denotes the last range in a selection
  // --------
  //

  this.isLast = function() {
    return this.pos === this.selection.endNode();
  };

  // Returns true if the range denotes the last range in a selection
  // --------
  //

  this.hasPredecessor = function() {
    return !this.isFirst();
  };

  // Returns true if the range denotes the last range in a selection
  // --------
  //

  this.hasSuccessor = function() {
    return !this.isLast();
  };

  // Returns true if the range is fully enclosed by both a preceding and successing range
  // --------
  //

  this.isEnclosed = function() {
    return this.hasPredecessor() && this.hasSuccessor();
  };

  // Returns true if the range includes the last character of a node
  // --------
  //

  this.isRightBound = function() {
    return this.end === this.component.getLength();
  };

  // Returns true if the range includes the first character of a node
  // --------
  //

  this.isLeftBound = function() {
    return this.start === 0;
  };

  // Returns the length of the range which corresponds to the number of chars contained
  // --------
  //

  this.length = function() {
    return this.end - this.start;
  };

  // Returns the range's content
  // --------
  //

  this.content = function() {
    throw new Error("Not supported anymore");
  };

  // Returns true if all chars are selected
  // --------
  //

  this.isFull = function() {
    return this.isLeftBound() && this.isRightBound();
  };

  // Returns true if the range includes the first character of a node
  // --------
  //

  this.isPartial = function() {
    return !this.isFull();
  };

};

Range.prototype = new Range.Prototype();

Object.defineProperties(Range.prototype, {
  node: {
    get: function() {
      throw new Error("Not supported anymore");
    },
    set: function() {
      throw new Error("Not supported anymore");
    }
  }
});

Selection.Range = Range;
Selection.SelectionError = SelectionError;

// Export
// ========

module.exports = Selection;

},{"./cursor":31,"substance-util":127,"underscore":134}],36:[function(require,module,exports){
"use strict";

module.exports = {
  "node": require("./src/node"),
  "text": require("./src/text"),
  "heading": require("./src/heading"),
  "codeblock": require("./src/codeblock"),
  "image": require("./src/image"),
  "figure": require("./src/figure"),
  "contributor": require("./src/contributor"),
  "cover": require("./src/cover"),
  "citation": require("./src/citation"),
  "annotation": require("./src/annotation"),
  "emphasis": require("./src/emphasis"),
  "strong": require("./src/strong"),
  "subscript": require("./src/subscript"),
  "superscript": require("./src/superscript"),
  "code": require("./src/code"),
  "link": require("./src/link"),
  "list": require("./src/list"),
  "list_item": require("./src/list_item"),
  "math": require("./src/math"),
  "issue": require("./src/issue"),
  "remark": require("./src/remark"),
  "error": require("./src/error"),
  "file": require("./src/file"),
  "blob_reference": require("./src/blob_reference"),
  "figure_reference": require("./src/figure_reference"),
  "citation_reference": require("./src/citation_reference"),
  "cross_reference": require("./src/cross_reference"),
  "remark_reference": require("./src/remark_reference"),
  "error_reference": require("./src/error_reference"),

  // deprecated: these node types will be re-implemented
  "paragraph": require("./src/paragraph"),
  "table": require("./src/table"),
  "formula": require("./src/formula"),
};

},{"./src/annotation":38,"./src/blob_reference":40,"./src/citation":43,"./src/citation_reference":45,"./src/code":47,"./src/codeblock":50,"./src/contributor":53,"./src/cover":56,"./src/cross_reference":58,"./src/emphasis":60,"./src/error":63,"./src/error_reference":65,"./src/figure":68,"./src/figure_reference":70,"./src/file":72,"./src/formula":75,"./src/heading":78,"./src/image":81,"./src/issue":82,"./src/link":85,"./src/list":87,"./src/list_item":90,"./src/math":93,"./src/node":95,"./src/paragraph":98,"./src/remark":101,"./src/remark_reference":104,"./src/strong":106,"./src/subscript":108,"./src/superscript":110,"./src/table":112,"./src/text":115}],37:[function(require,module,exports){
"use strict";

var DocumentNode = require('../node/node');
var _ = require('underscore');

var Annotation = function(node, document) {
  DocumentNode.call(this, node, document);
};

// Type definition
// --------

Annotation.type = {
  "id": "annotation",
  "properties": {
    "path": ["array", "string"], // -> e.g. ["text_1", "content"]
    "range": "object"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Annotation.description = {
  "name": "Annotation",
  "remarks": [
    "Abstract type for all available annotations"
  ],
  "properties": {
    "path": "References node and property in the graph.",
    "range": "Tuple describing start and end character offset."
  }
};


// Example Annotation
// -----------------
//

Annotation.example = {
  "type": "emphasis",
  "id": "emphasis_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

Annotation.Prototype = function() {
  this.getContent = function() {
    var content = this.document.get(this.path);
    if (content) {
      var range = this.range;
      return content.substring(range[0], range[1]);
    } else {
      console.error("FIXME: this annotation references a deleted node", this, this.path);
      return "N/A"
    }
  };
};

Annotation.Prototype.prototype = DocumentNode.prototype;
Annotation.prototype = new Annotation.Prototype();
Annotation.prototype.constructor = Annotation;

Annotation.prototype.defineProperties();

module.exports = Annotation;

},{"../node/node":96,"underscore":134}],38:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./annotation")
};

},{"./annotation":37}],39:[function(require,module,exports){
"use strict";

var Node = require('../node/node');

var BlobReference = function(node, document) {
  Node.call(this, node, document);
};

// Type definition
// --------

BlobReference.type = {
  "id": "blob_reference",
  "properties": {
    "path": ["array", "string"],
    "blob": "string"
  }
};

// This is used for the auto-generated docs
// -----------------
//

BlobReference.description = {
  "name": "BlobReference",
  "remarks": [
    "References a blob in the volatile blob store"
  ],
  "properties": {
    "path": "Referenced node/property",
    "blob": "Referenced blob id"
  }
};



BlobReference.Prototype = function() {};

BlobReference.Prototype.prototype = Node.prototype;
BlobReference.prototype = new BlobReference.Prototype();
BlobReference.prototype.constructor = BlobReference;

BlobReference.prototype.defineProperties();

module.exports = BlobReference;

},{"../node/node":96}],40:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./blob_reference")
};

},{"./blob_reference":39}],41:[function(require,module,exports){
var DocumentNode = require('../node/node');

// Citation
// -----------------
//

var Citation = function(node, document) {
  DocumentNode.call(this, node, document);
};

// Type definition
// -----------------
//

Citation.type = {
  "id": "article_citation", // type name
  "parent": "content",
  "properties": {
    "source_id": "string",
    "title": "string",
    "label": "string",
    "authors": ["array", "string"],
    "doi": "string",
    "source": "string",
    "volume": "string",
    "publisher_name": "string",
    "publisher_location": "string",
    "fpage": "string",
    "lpage": "string",
    "year": "string",
    "citation_urls": ["array", "string"]
  }
};

Citation.description = {
  "name": "Citation",
  "remarks": [
    "A journal citation.",
    "This element can be used to describe all kinds of citations."
  ],
  "properties": {
    "title": "The article's title",
    "label": "Optional label (could be a number for instance)",
    "doi": "DOI reference",
    "source": "Usually the journal name",
    "volume": "Issue number",
    "publisher_name": "Publisher Name",
    "publisher_location": "Publisher Location",
    "fpage": "First page",
    "lpage": "Last page",
    "year": "The year of publication",
    "citation_urls": "A list of links for accessing the article on the web"
  }
};

// Example Citation
// -----------------
//

Citation.example = {
  "id": "article_nature08160",
  "type": "article_citation",
  "label": "5",
  "title": "The genome of the blood fluke Schistosoma mansoni",
  "authors": [
    "M Berriman",
    "BJ Haas",
    "PT LoVerde"
  ],
  "doi": "http://dx.doi.org/10.1038/nature08160",
  "source": "Nature",
  "volume": "460",
  "fpage": "352",
  "lpage": "8",
  "year": "1984",
  "citation_urls": [
    "http://www.ncbi.nlm.nih.gov/pubmed/19606141"
  ]
};


Citation.Prototype = function() {
  // Returns the citation URLs if available
  // Falls back to the DOI url
  // Always returns an array;
  this.urls = function() {
    return this.properties.citation_urls.length > 0 ? this.properties.citation_urls
                                                    : [this.properties.doi];
  };
};

Citation.Prototype.prototype = DocumentNode.prototype;
Citation.prototype = new Citation.Prototype();
Citation.prototype.constructor = Citation;

// Generate getters
// --------

Citation.prototype.defineProperties();

// Property aliases
// ----

Object.defineProperties(Citation.prototype, {
  "header": {
    get: function() { return this.properties.title; },
    set: function() { throw new Error("This is a read-only alias property."); }
  }
});

module.exports = Citation;

},{"../node/node":96}],42:[function(require,module,exports){
"use strict";

var NodeView = require("../node").View;
var TextView = require("../text").View;

var $$ = require("substance-application").$$;

// Citation.View
// ==========================================================================


var CitationView = function(node) {
  NodeView.call(this, node);

  this.$el.attr({id: node.id});
  this.$el.addClass('citation');
};


CitationView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);

    var frag = document.createDocumentFragment(),
        node = this.node;

    // Note: delegating to TextView to inherit annotation support
    this.titleView = new TextView(this.node, this.viewFactory, {property: "title"});
    frag.appendChild(this.titleView.render().el);

    // Resource body
    // --------
    //
    // Wraps all resource details

    var bodyEl = $$('.resource-body');

    // Add Authors
    // -------

    this.authorEls = [];
    var authorsEl = $$('.authors');
    for (var i = 0; i < node.authors.length; i++) {
      var author = node.authors[i];
      this.authorEls.push($$('span.author', {
        text: author
      }));
      authorsEl.appendChild(this.authorEls[i]);
      authorsEl.appendChild(document.createTextNode(" "));
    }
    bodyEl.appendChild(authorsEl);

    // Add Source
    // -------
    var source = [];

    if (node.source && node.volume) {
      source.push([node.source, node.volume].join(', ')+": ");
    }

    if (node.fpage && node.lpage) {
      source.push([node.fpage, node.lpage].join('-')+", ");
    }

    if (node.publisher_name && node.publisher_location) {
      source.push([node.publisher_name, node.publisher_location].join(', ')+", ");
    }

    if (node.year) {
      source.push(node.year);
    }

    this.sourceEl = $$('.source', {
      html: source.join(''),
    });
    bodyEl.appendChild(this.sourceEl);

    // Add DOI (if available)
    // -------

    if (node.doi) {
      this.doiEl = $$('.doi', {
        children: [
          $$('b', {text: "DOI: "}),
          $$('a', {
            href: node.doi,
            target: "_new",
            text: node.doi
          })
        ]
      });
      bodyEl.appendChild(this.doiEl);
    }

    frag.appendChild(bodyEl);

    this.content.appendChild(frag);

    return this;
  };

  this.dispose = function() {
    NodeView.dispose.call(this);
    this.titleView.dispose();
  };
};

CitationView.Prototype.prototype = NodeView.prototype;
CitationView.prototype = new CitationView.Prototype();
CitationView.prototype.constructor = CitationView;

module.exports = CitationView;

},{"../node":95,"../text":115,"substance-application":1}],43:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./citation'),
  View: require('./citation_view')
};

},{"./citation":41,"./citation_view":42}],44:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var CitationReference = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

CitationReference.type = {
  "id": "citation_reference",
  "parent": "annotation",
  "properties": {
    "target": "citation"
  }
};

// This is used for the auto-generated docs
// -----------------
//

CitationReference.description = {
  "name": "CitationReference",
  "remarks": [
    "References a range in a text-ish node and references a citation."
  ],
  "properties": {
  }
};


// Example CitationReference annotation
// -----------------
//

CitationReference.example = {
  "type": "citation_reference_1",
  "id": "citation_reference_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

CitationReference.Prototype = function() {};

CitationReference.Prototype.prototype = Annotation.prototype;
CitationReference.prototype = new CitationReference.Prototype();
CitationReference.prototype.constructor = CitationReference;

CitationReference.prototype.defineProperties();

module.exports = CitationReference;

},{"../annotation/annotation":37}],45:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./citation_reference")
};

},{"./citation_reference":44}],46:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var Code = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

Code.type = {
  "id": "code",
  "parent": "annotation",
  "properties": {
  }
};


// This is used for the auto-generated docs
// -----------------
//

Code.description = {
  "name": "Code",
  "remarks": [
    "References a range in a text-ish node and tags it as subscript"
  ],
  "properties": {
  }
};


// Example Code annotation
// -----------------
//

Code.example = {
  "type": "code_1",
  "id": "code_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

Code.Prototype = function() {};

Code.Prototype.prototype = Annotation.prototype;
Code.prototype = new Code.Prototype();
Code.prototype.constructor = Code;

module.exports = Code;

},{"../annotation/annotation":37}],47:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./code")
};

},{"./code":46}],48:[function(require,module,exports){
"use strict";

var Text = require("../text/text_node");

var Codeblock = function(node, document) {
  Text.call(this, node, document);
};

// Type definition
// --------

Codeblock.type = {
  "id": "codeblock",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "content": "string"
  }
};

Codeblock.config = {
  "zoomable": true
};

// This is used for the auto-generated docs
// -----------------
//

Codeblock.description = {
  "name": "Codeblock",
  "remarks": [
    "Text in a codeblock is displayed in a fixed-width font, and it preserves both spaces and line breaks"
  ],
  "properties": {
    "content": "Content",
  }
};


// Example Formula
// -----------------
//

Codeblock.example = {
  "type": "codeblock",
  "id": "codeblock_1",
  "content": "var text = \"Sun\";\nvar op1 = Operator.TextOperation.Delete(2, \"n\");\ntext = op2.apply(op1.apply(text));\nconsole.log(text);",
};

Codeblock.Prototype = function() {};

Codeblock.Prototype.prototype = Text.prototype;
Codeblock.prototype = new Codeblock.Prototype();
Codeblock.prototype.constructor = Codeblock;

Codeblock.prototype.defineProperties();

module.exports = Codeblock;


},{"../text/text_node":116}],49:[function(require,module,exports){
"use strict";

var TextView = require('../text/text_view');

// Substance.Codeblock.View
// ==========================================================================

var CodeblockView = function(node) {
  TextView.call(this, node);

  this.$el.addClass('content-node codeblock');
};

CodeblockView.Prototype = function() {};

CodeblockView.Prototype.prototype = TextView.prototype;
CodeblockView.prototype = new CodeblockView.Prototype();

module.exports = CodeblockView;

},{"../text/text_view":117}],50:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./codeblock"),
  View: require("./codeblock_view")
};

},{"./codeblock":48,"./codeblock_view":49}],51:[function(require,module,exports){
var _ = require('underscore');
var DocumentNode = require('../node/node');

// Substance.Contributor
// -----------------
//

var Contributor = function(node, doc) {
  DocumentNode.call(this, node, doc);
};


// Type definition
// -----------------
//

Contributor.type = {
  "id": "contributor",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "name": "string", // full author name
    "role": "string",
    "organization": "string",
    "image": "blob", // optional
    "image_url": "string",
    "email": "string",
    "contribution": "string"
  }
};

// This is used for the auto-generated docs
// -----------------
//

Contributor.description = {
  "name": "Contributor",
  "remarks": [
    "Describes an article contributor such as an author or editor.",
  ],
  "properties": {
    "name": "Full name.",
  }
};

// Example Video
// -----------------
//

Contributor.example = {
  "id": "contributor_1",
  "type": "contributor",
  "role": "author",
  "name": "John Doe",
  "email": "a@b.com",
  "contribution": "Revising the article, data cleanup"
};

Contributor.Prototype = function() {
  this.getAffiliations = function() {
    return _.map(this.properties.affiliations, function(affId) {
      return this.document.get(affId);
    }, this);
  };

  this.getBlob = function() {
    if (!this.properties.image) return null;
    var file = this.document.get(this.properties.image);
    if (!file) return null;
    return file.getData();
  };

  // Depending on wheter there is a blob it returns either the blob url or a regular image url
  // --------
  // 

  this.getUrl = function() {
    var blob = this.getBlob();
    if (blob) {
      return window.URL.createObjectURL(blob);
    } else {
      return this.properties.image_url;
    }
  };
};

Contributor.Prototype.prototype = DocumentNode.prototype;
Contributor.prototype = new Contributor.Prototype();
Contributor.prototype.constructor = Contributor;

Contributor.prototype.defineProperties();

// Property aliases
// ----

Object.defineProperties(Contributor.prototype, {
  "header": {
    get: function() { return this.properties.name; },
    set: function() { throw new Error("This is a read-only alias property."); }
  }
});

module.exports = Contributor;

},{"../node/node":96,"underscore":134}],52:[function(require,module,exports){
"use strict";

var NodeView = require("../node").View;
var $$ = require("substance-application").$$;
var TextView = require("../text/text_view");

// Substance.Contributor.View
// ==========================================================================

var ContributorView = function(node) {
  NodeView.call(this, node);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node contributor");
};

ContributorView.Prototype = function() {

  // Render it
  // --------
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    // Name element (used as a header for the resource card)
    // -------

    this.nameView = new TextView(this.node, this.viewFactory, {property: "name"});
    $(this.nameView.el).addClass('toggle-resource');
    this.content.appendChild(this.nameView.render().el);

    // Resource Body
    // -------
    //
    // Wraps all the contents of the resource card

    var body = $$('.resource-body');

    // Image
    // -------

    var url = this.node.image || this.node.image_url;

    if (url) {
      this.imageEl = $$('.image', {
        children: [$$('img', {src: url})]
      });
      body.appendChild(this.imageEl);
    }

    // Organization
    // -------

    this.organizationView = new TextView(this.node, this.viewFactory, {property: "organization"});
    body.appendChild(this.organizationView.render().el);


    // Contribution
    // -------

    if (this.node.contribution) {
      body.appendChild($$('.label', {text: 'Contribution'}));
      this.contribEl = $$('.contribution.node-property', {text: this.node.contribution, "data-path": "contribution"});
      body.appendChild(this.contribEl);
    }

    // Email
    // -------

    body.appendChild($$('.label', {text: 'Email', contenteditable: false}));
    this.emailView = new TextView(this.node, this.viewFactory, {property: "email"});
    body.appendChild(this.emailView.render().el);

    this.content.appendChild(body);

    return this;
  };

  this.dispose = function() {
    NodeView.dispose.call(this);
    this.nameView.dispose();
    this.organization.dispose();
    this.emailView.dispose();
  };


};

ContributorView.Prototype.prototype = NodeView.prototype;
ContributorView.prototype = new ContributorView.Prototype();

module.exports = ContributorView;

},{"../node":95,"../text/text_view":117,"substance-application":1}],53:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./contributor"),
  View: require("./contributor_view")
};

},{"./contributor":51,"./contributor_view":52}],54:[function(require,module,exports){
var _ = require('underscore');
var DocumentNode = require('../node/node');

// Cover
// -----------------
//

var Cover = function(node, doc) {
  DocumentNode.call(this, node, doc);
};

// Type definition
// -----------------
//

Cover.type = {
  "id": "cover",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "image": "string"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Cover.description = {
  "name": "Cover",
  "remarks": [
    "Virtual view on the title and authors of the paper."
  ],
  "properties": {

  }
};

// Example Cover
// -----------------
//

Cover.example = {
  "id": "cover",
  "type": "cover",
  "image": "http://example.com/image.png"
};

Cover.Prototype = function() {
};

Cover.Prototype.prototype = DocumentNode.prototype;
Cover.prototype = new Cover.Prototype();
Cover.prototype.constructor = Cover;

Cover.prototype.defineProperties();

// Property aliases
// --------

Object.defineProperties(Cover.prototype, {
  title: {
    get: function() {
      return this.document.title;
    },
    set: function() {
      throw new Error("This is a read-only property alias.");
    }
  }
});

module.exports = Cover;

},{"../node/node":96,"underscore":134}],55:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var $$ = require("substance-application").$$;
var NodeView = require("../node/node_view");
var TextView = require("../text/text_view");
var Annotator = require("substance-document").Annotator;

// Lens.Cover.View
// ==========================================================================

var CoverView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.attr({id: node.id});
  this.$el.addClass("content-node cover");
};

CoverView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);

    if (this.node.document.published_on) {
      this.content.appendChild($$('.published-on', {
        contenteditable: false,
        html: new Date(this.node.document.published_on).toDateString()
      }));
    }

    this.titleView =  new TextView(this.node, this.viewFactory, {property: "title"});
    this.content.appendChild(this.titleView.render().el);
    this.titleView.el.classList.add("title");

    this.authorsEl = $$('.authors');

    this.renderAuthors();
    this.content.appendChild(this.authorsEl);

    return this;
  };

  this.dispose = function() {
    NodeView.dispose.call(this);
    this.titleView.dispose();
  };

  this.renderAuthors = function() {
    this.authorsEl.innerHTML = "";

    var authors = this.node.document.getAuthors();
    _.each(authors, function(a) {
      var authorEl = $$('a.toggle-author', {
        id: "toggle_"+a.id,
        href: "#",
        text: a.name,
        'data-id': a.id,
      });

      this.authorsEl.appendChild(authorEl);
    }, this);
  };

  this.onGraphUpdate = function(op) {
    // Call super handler and return if that has processed the operation already
    if (NodeView.prototype.onGraphUpdate.call(this, op)) {
      return true;
    }

    if (_.isEqual(op.path, ["document","title"])) {
      this.titleView.renderContent();
      return true;
    } else if (_.isEqual(op.path, ["document", "authors"])) {
      this.renderAuthors();
    }

    // Otherwise deal with annotation changes
    // Note: the annotations do not get attached to ["document", "title"],
    // as it seems strange to annotate a property which is used in such an indirect way
    if (Annotator.changesAnnotations(this.node.document, op, ["cover", "title"])) {
      //console.log("Rerendering TextView due to annotation update", op);
      this.titleView.renderContent();
      return true;
    }
  };
};

CoverView.Prototype.prototype = NodeView.prototype;
CoverView.prototype = new CoverView.Prototype();

module.exports = CoverView;

},{"../node/node_view":97,"../text/text_view":117,"substance-application":1,"substance-document":28,"underscore":134}],56:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./cover'),
  View: require('./cover_view')
};

},{"./cover":54,"./cover_view":55}],57:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var CrossReference = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

CrossReference.type = {
  "id": "cross_reference",
  "parent": "annotation",
  "properties": {
    "target": "content"
  }
};


// This is used for the auto-generated docs
// -----------------
//

CrossReference.description = {
  "name": "CrossReference",
  "remarks": [
    "References a range in a text-ish node and references a content node."
  ],
  "properties": {

  }
};


// Example CrossReference annotation
// -----------------
//

CrossReference.example = {
  "type": "cross_reference_1",
  "id": "cross_reference_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

CrossReference.Prototype = function() {};

CrossReference.Prototype.prototype = Annotation.prototype;
CrossReference.prototype = new CrossReference.Prototype();
CrossReference.prototype.constructor = CrossReference;

CrossReference.prototype.defineProperties();

module.exports = CrossReference;

},{"../annotation/annotation":37}],58:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./cross_reference")
};

},{"./cross_reference":57}],59:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var Emphasis = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

Emphasis.type = {
  "id": "emphasis",
  "parent": "annotation",
  "properties": {
  }
};


// This is used for the auto-generated docs
// -----------------
//

Emphasis.description = {
  "name": "Emphasis",
  "remarks": [
    "References a range in a text-ish node and tags it as emphasized"
  ],
  "properties": {
  }
};


// Example Emphasis annotation
// -----------------
//

Emphasis.example = {
  "type": "emphasis",
  "id": "emphasis_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

Emphasis.Prototype = function() {};

Emphasis.Prototype.prototype = Annotation.prototype;
Emphasis.prototype = new Emphasis.Prototype();
Emphasis.prototype.constructor = Emphasis;

module.exports = Emphasis;


},{"../annotation/annotation":37}],60:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./emphasis")
};

},{"./emphasis":59}],61:[function(require,module,exports){
"use strict";

var Issue = require('../issue/issue');

var ErrorNode = function(node, document) {
  Issue.call(this, node, document);
};

// Type definition
// --------

ErrorNode.type = {
  "id": "error",
  "parent": "issue",
  "properties": {
  }
};


// This is used for the auto-generated docs
// -----------------
//

ErrorNode.description = {
  "name": "Error",
  "remarks": [
    "References a range in a text-ish node and tags it as emphasized"
  ],
  "properties": {
  }
};


// Example Error annotation
// -----------------
//

ErrorNode.example = {
  "type": "error",
  "id": "error_1",
  "title": "Hi I am an a error",
  "description": "An error, yes."
};

ErrorNode.Prototype = function() {};

ErrorNode.Prototype.prototype = Issue.prototype;
ErrorNode.prototype = new ErrorNode.Prototype();
ErrorNode.prototype.constructor = ErrorNode;

module.exports = ErrorNode;

},{"../issue/issue":83}],62:[function(require,module,exports){
"use strict";

var IssueView = require("../issue/issue_view");

var ErrorView = function(node, viewFactory) {
  IssueView.call(this, node, viewFactory);
};

ErrorView.Prototype = function() {

};

ErrorView.Prototype.prototype = IssueView.prototype;
ErrorView.prototype = new ErrorView.Prototype();

module.exports = ErrorView;

},{"../issue/issue_view":84}],63:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./error"),
  View: require("./error_view")
};

},{"./error":61,"./error_view":62}],64:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var ErrorReference = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

ErrorReference.type = {
  "id": "error_reference",
  "parent": "annotation",
  "properties": {
    "target": "error"
  }
};

// This is used for the auto-generated docs
// -----------------
//

ErrorReference.description = {
  "name": "ErrorReference",
  "remarks": [
    "References a range in a text-ish node and references an error"
  ],
  "properties": {
    "target": "Referenced error id"
  }
};


// Example ErrorReference annotation
// -----------------
//

ErrorReference.example = {
  "type": "error_reference_1",
  "id": "error_reference_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ],
  "target": "error_1"
};

ErrorReference.Prototype = function() {};

ErrorReference.Prototype.prototype = Annotation.prototype;
ErrorReference.prototype = new ErrorReference.Prototype();
ErrorReference.prototype.constructor = ErrorReference;

ErrorReference.prototype.defineProperties();

module.exports = ErrorReference;

},{"../annotation/annotation":37}],65:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./error_reference")
};

},{"./error_reference":64}],66:[function(require,module,exports){
"use strict";

var DocumentNode = require("../node/node");

var Figure = function(node, document) {
  DocumentNode.call(this, node, document);
};

Figure.type = {
  "id": "figure",
  "parent": "content",
  "properties": {
    "image": "blob_reference",
    "image_url": "string",
    "label": "string",
    "caption": "paragraph"
  }
};

Figure.description = {
  "name": "Figure",
  "remarks": [
    "A figure is a figure is figure."
  ],
  "properties": {
    "label": "Figure label (e.g. Figure 1)",
    "image": "BlobReference id that has the image blob",
    "image_url": "Image url",
    "caption": "A reference to a paragraph that describes the figure",
  }
};

// Example Figure
// -----------------
//

Figure.example = {
  "id": "figure_1",
  "label": "Figure 1",
  "url": "http://example.com/fig1.png",
  "image": "",
  "caption": "paragraph_1"
};

Figure.config = {
  "zoomable": true
};

Figure.Prototype = function() {

  this.hasCaption = function() {
    return (!!this.properties.caption);
  };

  this.getCaption = function() {
    if (this.properties.caption) return this.document.get(this.properties.caption);
  };

  this.getBlob = function() {
    if (!this.properties.image) return null;
    var file = this.document.get(this.properties.image);
    if (!file) return null;
    return file.getData();
  };

  // Depending on wheter there is a blob it returns either the blob url or a regular image url
  // --------
  // 

  this.getUrl = function() {
    var blob = this.getBlob();
    if (blob) {
      return window.URL.createObjectURL(blob);
    } else {
      return this.properties.image_url;
    }
  };
};

Figure.Prototype.prototype = DocumentNode.prototype;
Figure.prototype = new Figure.Prototype();
Figure.prototype.constructor = Figure;

Figure.prototype.defineProperties();

// Property aliases:
// ----

Object.defineProperties(Figure.prototype, {
  // Used as a resource header
  header: {
    get: function() { return this.properties.label; },
    set: function() { throw new Error("This is a read-only alias property."); }
  }
});

// a factory method to create nodes more conveniently
// Supported
//  - id: unique id
//  - url: a relative path or a web URL
//  - caption: a string used as caption
Figure.create = function(data) {

  var result = {};

  var figId = data.id;
  var figure = {
    id: figId,
    type: "figure",
    label: data.label,
    image_url: data.image_url
  };

  if (data.caption) {
    var captionId = "caption_" + data.id;
    var caption = {
      id: captionId,
      type: "text",
      content: data.caption
    };
    result[captionId] = caption;
    figure.caption = captionId;
  }

  result[figId] = figure;
  return result;
};

module.exports = Figure;

},{"../node/node":96}],67:[function(require,module,exports){
"use strict";

var $$ = require ("substance-application").$$;
var NodeView = require("../node/node_view");
var TextView = require("../text/text_view");

// Substance.Figure.View
// ==========================================================================

var FigureView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};


FigureView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    this.labelView = new TextView(this.node, this.viewFactory, {property: "label"});
    $(this.labelView.el).addClass('toggle-resource');
    this.content.appendChild(this.labelView.render().el);

    // Resource body
    // --------
    //
    // Wraps all resource details

    var bodyEl = $$('.resource-body');

    // Prepares blobs etc. for the image
    var url = this.node.image || this.node.image_url;
    
    // Add graphic (img element)
    this.imgWrapper = $$('.image-wrapper', {
      children: [
        $$("a", {
          href: url,
          title: "View image in full size",
          target: "_blank",
          children: [$$('img', {src: url})]
        })
      ]
    });

    bodyEl.appendChild(this.imgWrapper);

    var caption = this.node.getCaption();
    if (caption) {
      this.captionView = this.viewFactory.createView(caption);
      var captionEl = this.captionView.render().el;
      captionEl.classList.add('caption');
      bodyEl.appendChild(captionEl);
    }

    this.content.appendChild(bodyEl);
    return this;
  };

  this.dispose = function() {
    NodeView.dispose.call(this);
    this.labelView.dispose();
    if (this.captionView) this.captionView.dispose();
  };


};

FigureView.Prototype.prototype = NodeView.prototype;
FigureView.prototype = new FigureView.Prototype();

module.exports = FigureView;

},{"../node/node_view":97,"../text/text_view":117,"substance-application":1}],68:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./figure'),
  View: require('./figure_view')
};

},{"./figure":66,"./figure_view":67}],69:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var FigureReference = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

FigureReference.type = {
  "id": "figure_reference",
  "parent": "annotation",
  "properties": {
    "target": "figure"
  }
};

// This is used for the auto-generated docs
// -----------------
//

FigureReference.description = {
  "name": "FigureReference",
  "remarks": [
    "References a range in a text-ish node and references a figure"
  ],
  "properties": {
    "target": "Referenced figure id"
  }
};


// Example FigureReference annotation
// -----------------
//

FigureReference.example = {
  "type": "figure_reference_1",
  "id": "figure_reference_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

FigureReference.Prototype = function() {};

FigureReference.Prototype.prototype = Annotation.prototype;
FigureReference.prototype = new FigureReference.Prototype();
FigureReference.prototype.constructor = FigureReference;

FigureReference.prototype.defineProperties();

module.exports = FigureReference;

},{"../annotation/annotation":37}],70:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./figure_reference")
};

},{"./figure_reference":69}],71:[function(require,module,exports){
"use strict";

var DocumentNode = require("../node/node");
var _ = require("underscore");

var File = function(node, document) {
  DocumentNode.call(this, node, document);
};


File.type = {
  "id": "file",
  "parent": "content",
  "properties": {
    "version": "number",
    "content_type": "string" // content mime type
  }
};


File.description = {
  "name": "File",
  "remarks": [
    "A file is a file is a file."
  ],
  "properties": {
    "content_type": "Content MIME type",
    "version": "File version, gets incremented every time the file content changes."
  }
};

// Example File
// -----------------
//

File.example = {
  "id": "figure1.png",
  "version": 1,
  "content_type": "image/png"
};


File.Prototype = function() {

  this.isText = function() {
    return _.include(["application/json", "text/css", "text/plain"], this.properties.content_type);
  };

  this.isBinary = function() {
    return !this.isText();
  };

  this.isJSON = function() {
    return this.properties.content_type === "application/json";
  };

  this.getData = function(version) {
    var dataKey = this.properties.id+".v"+(version || this.properties.version);
    return this.document.fileData[dataKey];
  };

  // Assigns a data object from the temporary data store
  this.updateData = function(data) {
    var version = this.properties.version;

    // Version is set and no record exists in doc.fileData
    if (version && !this.getData(version)) {
      // Initialize = silent data update without triggering a version bump
    } else {
      version = version ? version + 1 : 1;
    }

    var dataKey = this.properties.id+".v"+version;

    // First create the data in our temporary data store
    if (this.isJSON()) {
      this.document.fileData[dataKey] = JSON.parse(data);
    } else if (this.isText()) { // Text data
      this.document.fileData[dataKey] = data;
    } else { // Binary data
      this.document.fileData[dataKey] = new Blob([data], {type: this.properties.content_type});
    }

    if (version !== this.properties.version) {
      // FigureView / ContributorView is listening to this operation
      this.document.set([this.properties.id, "version"], version);  
    }
  };

};

File.Prototype.prototype = DocumentNode.prototype;
File.prototype = new File.Prototype();
File.prototype.constructor = File;

File.prototype.defineProperties();

module.exports = File;
},{"../node/node":96,"underscore":134}],72:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./file")
};

},{"./file":71}],73:[function(require,module,exports){
"use strict";

var DocumentNode = require('../node/node');

// Formula
// -----------------
//

var Formula = function(node) {
  DocumentNode.call(this, node);
};

// Type definition
// -----------------
//

Formula.type = {
  "id": "formula",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "label": "string",
    "data": "string",
    "format": "string", // MathML, LaTeX, image
    "inline": "boolean"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Formula.description = {
  "name": "Formula",
  "remarks": [
    "Can either be expressed in MathML format or using an image url"
  ],
  "properties": {
    "label": "Formula label (4)",
    "data": "Formula data, either MathML or image url",
    "format": "Can either be `mathml` or `image`"
  }
};


// Example Formula
// -----------------
//

Formula.example = {
  "type": "formula",
  "id": "formula_eqn1",
  "label": "(1)",
  "content": "<mml:mrow>...</mml:mrow>",
  "format": "mathml"
};

Formula.Prototype = function() {
  this.inline = false;
};

Formula.Prototype.prototype = DocumentNode.prototype;
Formula.prototype = new Formula.Prototype();
Formula.prototype.constructor = Formula;

Formula.prototype.defineProperties();

module.exports = Formula;

},{"../node/node":96}],74:[function(require,module,exports){
"use strict";

var NodeView = require('../node/node_view');

// FormulaView
// ===========

var FormulaView = function(node) {
  NodeView.call(this, node);

  this.$el.attr({id: node.id});
  this.$el.addClass('content-node formula');
  if (this.node.inline) {
    this.$el.addClass('inline');
  }
};

FormulaView.Prototype = function() {

  // Render the formula
  // --------

  this.render = function() {
    NodeView.prototype.render.call(this);

    var format = this.node.format;
    switch (format) {
    case "mathml":
      this.$el.html(this.node.data);

      // This makes the UI freeze when many formulas are in the document.
      // MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el]);
      break;
    case "image":
      this.$el.append('<img src="'+this.node.url+'"/>');
      break;
    case "latex":
      if (this.node.inline) {
        this.$el.html("\\("+this.node.data+"\\)");
      } else {
        this.$el.html("\\["+this.node.data+"\\]");
      }

      // This makes the UI freeze when many formulas are in the document.
      // MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el]);
      break;
    default:
      console.error("Unknown formula format:", format);
    }

    // Add label to block formula
    // --------
    if (this.node.label) {
      this.$el.append($('<div class="label">').html(this.node.label));
    }

    return this;
  };
};

FormulaView.Prototype.prototype = NodeView.prototype;
FormulaView.prototype = new FormulaView.Prototype();

module.exports = FormulaView;

},{"../node/node_view":97}],75:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require('./formula'),
  View: require('./formula_view')
};

},{"./formula":73,"./formula_view":74}],76:[function(require,module,exports){
"use strict";

var Text = require("../text/text_node");

var Heading = function(node, document) {
  Text.call(this, node, document);
};

// Type definition
// -----------------
//

Heading.type = {
  "id": "heading",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "content": "string",
    "level": "number"
  }
};

// Example Heading
// -----------------
//

Heading.example = {
  "type": "heading",
  "id": "heading_1",
  "content": "Introduction",
  "level": 1
};

// This is used for the auto-generated docs
// -----------------
//


Heading.description = {
  "name": "Heading",
  "remarks": [
    "Denotes a section or sub section in your article."
  ],
  "properties": {
    "content": "Heading content",
    "level": "Heading level. Ranges from 1..4"
  }
};

Heading.Prototype = function() {
  this.splitInto = 'paragraph';
};

Heading.Prototype.prototype = Text.prototype;
Heading.prototype = new Heading.Prototype();
Heading.prototype.constructor = Heading;

Heading.prototype.defineProperties();

module.exports = Heading;

},{"../text/text_node":116}],77:[function(require,module,exports){
"use strict";

var TextView = require('../text/text_view');

// Substance.Heading.View
// ==========================================================================

var HeadingView = function(node) {
  TextView.call(this, node);
  this.$el.addClass('heading');

  this._level = this.node.level;
  this.$el.addClass('level-'+this._level);
};

HeadingView.Prototype = function() {
  var __super__ = TextView.prototype;

  this.onNodeUpdate = function(op) {
    __super__.onNodeUpdate.call(this, op);
    if (op.path[1] === "level") {
      this.$el.removeClass('level-'+this._level);

      this._level = this.node.level;
      this.$el.addClass('level-'+this._level);
    }
  };

};

HeadingView.Prototype.prototype = TextView.prototype;
HeadingView.prototype = new HeadingView.Prototype();

module.exports = HeadingView;

},{"../text/text_view":117}],78:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./heading"),
  View: require("./heading_view")
};

},{"./heading":76,"./heading_view":77}],79:[function(require,module,exports){
"use strict";

var DocumentNode = require('../node/node');

// var WebResource = require("../web_resource/web_resource");

var ImageNode = function(node, document) {
  DocumentNode.call(this, node, document);
};

// Type definition
// -----------------
//

ImageNode.type = {
  "id": "image",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "url": "string"
  }
};

// This is used for the auto-generated docs
// -----------------
//


ImageNode.description = {
  "name": "Image",
  "remarks": [
    "Represents an image web resource."
  ],
  "properties": {
    "url": "URL to a resource",
  }
};


// Example Image
// -----------------
//

ImageNode.example = {
  "type": "image",
  "id": "image_1",
  "url": "http://substance.io/image_1.png"
};

ImageNode.Prototype = function() {};

ImageNode.Prototype.prototype = DocumentNode.prototype;
ImageNode.prototype = new ImageNode.Prototype();
ImageNode.prototype.constructor = ImageNode;

ImageNode.prototype.defineProperties();

module.exports = ImageNode;

},{"../node/node":96}],80:[function(require,module,exports){
"use strict";

var NodeView = require("../node/node");
var $$ = require ("substance-application").$$;

// Substance.Image.View
// ==========================================================================

var ImageView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.$el.addClass('image');
  this.$el.attr('id', this.node.id);
};

ImageView.Prototype = function() {

  // Render Markup
  // --------
  //
  // div.content
  //   div.img-char
  //     .img

  this.render = function() {
    NodeView.prototype.render.call(this);

    var imgCharEl = this.imgCharEl = $$(".image-char");
    var img = $$('img',
      {
        src: this.node.url,
        alt: "alt text",
        title: "alt text",
      }
    );
    imgCharEl.appendChild(img);
    this.content.appendChild(imgCharEl);

    return this;
  };

  this.delete = function(pos, length) {
    var content = this.$('.content')[0];
    var spans = content.childNodes;
    for (var i = length - 1; i >= 0; i--) {
      content.removeChild(spans[pos+i]);
    }
  };
};

ImageView.Prototype.prototype = NodeView.prototype;
ImageView.prototype = new ImageView.Prototype();

module.exports = ImageView;

},{"../node/node":96,"substance-application":1}],81:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./image"),
  View: require("./image_view")
};

},{"./image":79,"./image_view":80}],82:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./issue"),
  View: require("./issue_view")
};

},{"./issue":83,"./issue_view":84}],83:[function(require,module,exports){
"use strict";

var DocumentNode = require('../node/node');

var Issue = function(node, document) {
  DocumentNode.call(this, node, document);
};

// Type definition
// --------

Issue.type = {
  "id": "issue",
  "properties": {
    "title": "string",
    "description": "string", // should be a reference to a text node?
    "creator": "string",
    "created_at": "date" // should be date
  }
};


// This is used for the auto-generated docs
// -----------------
//

Issue.description = {
  "name": "Issue",
  "remarks": [
    "References a range in a text-ish node and tags it as subscript"
  ],
  "properties": {
    "title": "Issue Title",
    "description": "More verbose issue description",
    "creator": "Issue creator",
    "created_at": "Date and time of issue creation."
  }
};


// Example Issue annotation
// -----------------
//

Issue.example = {
  "abstract": "type"
};

Issue.Prototype = function() {

  this.hasDescription = function() {
    return (!!this.properties.caption);
  };

  this.getDescription = function() {
    if (this.properties.description) return this.document.get(this.properties.description);
  };

  this.getReferences = function() {
    var references = this.document.indexes['references'];
    if (references) {
      return references.get(this.properties.id);
    } else {
      console.error("No index for references.")
      return [];
    }
  };

};

Issue.Prototype.prototype = DocumentNode.prototype;
Issue.prototype = new Issue.Prototype();
Issue.prototype.constructor = Issue;

Issue.prototype.defineProperties();

module.exports = Issue;

},{"../node/node":96}],84:[function(require,module,exports){
"use strict";

var $$ = require ("substance-application").$$;
var NodeView = require("../node/node_view");
var TextView = require("../text/text_view");


// Substance.Issue.View
// ==========================================================================

var IssueView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  // This class is shared among all issue subtypes (errors, remarks)
  this.$el.addClass('issue');
};

IssueView.Prototype = function() {

  var __super__ = NodeView.prototype;

  this._updateTitle = function() {
    if (this.ref) {
      this.titleTextEl.innerHTML = this.ref.getContent();
    } else {
      this.titleTextEl.innerHTML = "";
    }
  };

  // Rendering
  // =============================
  //

  this.render = function() {
    NodeView.prototype.render.call(this);

    //Note: we decided to render the text of the reference instead of
    //the title property
    var titleViewEl = $$('div.issue-title-wrapper')
    this.titleTextEl = $$('.text.title')
    titleViewEl.appendChild(this.titleTextEl);
    this.content.appendChild(titleViewEl);

    // Creator and date
    // --------

    var creator = $$('div.creator', {
      text: (this.node.creator || "Anonymous") + ", " + jQuery.timeago(new Date(this.node.created_at)),
      contenteditable: false // Make sure this is not editable!
    });

    // labelView.el.appendChild(creator);

    this.descriptionView = new TextView(this.node, this.viewFactory, {property: "description"});
    this.content.appendChild(this.descriptionView.render().el);

    var refs = this.node.getReferences();
    var refIds = Object.keys(refs);
    if (refIds.length > 0) {
      this.ref = refs[refIds[0]];
      this._updateTitle()
    }

    return this;
  };

  this.dispose = function() {
    NodeView.dispose.call(this);
    this.descriptionView.dispose();
  };

  this.onNodeUpdate = function(op) {
    if (op.path[1] === "description") {
      this.descriptionView.onNodeUpdate(op);
      return true;
    } else {
      return false;
    }
  };

  this.onGraphUpdate = function(op) {
    if (__super__.onGraphUpdate.call(this, op)) {
      return true;
    }
    // Hack: lazily detecting references to this issue
    // by *only* checking 'create' ops with an object having this node as target
    else if (op.type === "create" && op.val["target"] === this.node.id) {
      this.ref = this.node.document.get(op.val.id);
      this._updateTitle();
      return true;
    }
    // ... the same in inverse direction...
    else if (op.type === "delete" && op.val["target"] === this.node.id) {
      this.ref = null;
      this._updateTitle();
      return true;
    }
    else if (this.ref && op.path[0] === this.ref.id) {
      this._updateTitle();
      return true;
    } else {
      return false;
    }
  };

};


IssueView.Prototype.prototype = NodeView.prototype;
IssueView.prototype = new IssueView.Prototype();

module.exports = IssueView;

},{"../node/node_view":97,"../text/text_view":117,"substance-application":1}],85:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./link")
};

},{"./link":86}],86:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var Link = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

Link.type = {
  "id": "link",
  "parent": "annotation",
  "properties": {
    "url": "string"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Link.description = {
  "name": "Link",
  "remarks": [
    "References a range in a text-ish node and tags it as subscript"
  ],
  "properties": {
  }
};


// Example Link annotation
// -----------------
//

Link.example = {
  "type": "link_1",
  "id": "link_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

Link.Prototype = function() {};

Link.Prototype.prototype = Annotation.prototype;
Link.prototype = new Link.Prototype();
Link.prototype.constructor = Link;

Link.prototype.defineProperties();

module.exports = Link;

},{"../annotation/annotation":37}],87:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./list"),
  View: require("./list_view")
};

},{"./list":88,"./list_view":89}],88:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var DocumentNode = require('../node/node');

var List = function(node, document) {
  DocumentNode.call(this, node, document);
};

List.type = {
  "id": "list",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "items": ["array", "list_item"],
    "ordered": "boolean"
  }
};


// This is used for the auto-generated docs
// -----------------
//

List.description = {
  "name": "List",
  "remarks": [
    "Lists can either be numbered or bullet lists"
  ],
  "properties": {
    "ordered": "Specifies wheter the list is ordered or not",
    "items": "An array of listitem references",
  }
};


// Example Formula
// -----------------
//

List.example = {
  "type": "list",
  "id": "list_1",
  "items ": [
    "listitem_1",
    "listitem_2",
  ]
};

List.Prototype = function() {

  this.getItems = function() {
    return _.map(this.properties.items, function(id) {
      return this.document.get(id);
    }, this);
  };

};

List.Prototype.prototype = DocumentNode.prototype;
List.prototype = new List.Prototype();
List.prototype.constructor = List;

List.prototype.defineProperties();

module.exports = List;

},{"../node/node":96,"underscore":134}],89:[function(require,module,exports){
"use strict";

var NodeView = require("../node/node_view");
var _ = require("underscore");
var $$ = require("substance-application").$$;

// Substance.Image.View
// ==========================================================================

var ListView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

  this.el = node.ordered ? $$('ol') : $$('ul');
  this.$el = $(this.el);
  this.$el.addClass('content-node').addClass(node.type);
  this.$el.attr('id', this.node.id);

  this.childViews = {};
};

ListView.Prototype = function() {

  var __super__ = NodeView.prototype;

  this.render = function() {
    __super__.render.call(this);

    _.each(this.node.getItems(), function(item) {
      var itemView = this.viewFactory.createView(item, "overwrite");
      this.content.appendChild(itemView.render().el);
      this.childViews[item.id] = itemView;
    }, this);

    return this;
  };

  this.onNodeUpdate = function(op) {
    if (op.path[0] === this.node.id && op.path[1] === "items") {
      this.render();
    }
  };

  this.dispose = function() {
    __super__.dispose.call(this);
  };
};

ListView.Prototype.prototype = NodeView.prototype;
ListView.prototype = new ListView.Prototype();

module.exports = ListView;

},{"../node/node_view":97,"substance-application":1,"underscore":134}],90:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./list_item"),
  View: require("./list_item_view")
};

},{"./list_item":91,"./list_item_view":92}],91:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var TextNode = require('../text/text_node');

var ListItem = function(node, document) {
  TextNode.call(this, node, document);
};

ListItem.type = {
  "id": "list_item",
  "parent": "content",
  "properties": {
    "level": "number",
    "content": "string"
  }
};


// This is used for the auto-generated docs
// -----------------
//

ListItem.description = {
  "name": "ListItem",
  "remarks": [
    "ListItems have a level of nesting."
  ],
  "properties": {
    "level": "Specifies the indentation level",
    "content": "The item's content",
  }
};


// Example Formula
// -----------------
//

ListItem.example = {
  "type": "list_item",
  "id": "list_item_1",
  "level": 1,
  "content": "This is item 1"
};

ListItem.Prototype = function() {
};

ListItem.Prototype.prototype = TextNode.prototype;;
ListItem.prototype = new ListItem.Prototype();
ListItem.prototype.constructor = ListItem;

ListItem.prototype.defineProperties();

module.exports = ListItem;

},{"../text/text_node":116,"underscore":134}],92:[function(require,module,exports){
"use strict";

var TextView = require("../text/text_view");
var _ = require("underscore");
var $$ = require("substance-application").$$;

// Substance.Image.View
// ==========================================================================

var ListItemView = function(node, viewFactory) {
  TextView.call(this, node);

  this.el = $$('li.list-item');
  this.$el = $(this.el);
  this.$el.attr('id', this.node.id);

  // Note: this element has no 'content-node' class as it is not a top-level node.
  // Instead it has a data-path.
  this.$el.attr('data-path', node.id);

  this._level = this.node.level;
  this.$el.addClass('level-'+this._level);
};

ListItemView.Prototype = function() {
  var __super__ = TextView.prototype;

  this.onNodeUpdate = function(op) {
    __super__.onNodeUpdate.call(this, op);
    if (op.path[1] === "level") {
      this.$el.removeClass('level-'+this._level);

      this._level = this.node.level;
      this.$el.addClass('level-'+this._level);
    }
  };

  this.dispose = function() {
    console.log("Disposing ListItemView...");
    __super__.dispose.call(this);
  };

};

ListItemView.Prototype.prototype = TextView.prototype;
ListItemView.prototype = new ListItemView.Prototype();

module.exports = ListItemView;

},{"../text/text_view":117,"substance-application":1,"underscore":134}],93:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./math")
};

},{"./math":94}],94:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var Math = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

Math.type = {
  "id": "math",
  "parent": "annotation",
  "properties": {
  }
};


// This is used for the auto-generated docs
// -----------------
//

Math.description = {
  "name": "Math",
  "remarks": [
    "References a range in a text-ish node and tags it as subscript"
  ],
  "properties": {
  }
};


// Example Math annotation
// -----------------
//

Math.example = {
  "type": "math_1",
  "id": "math_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

Math.Prototype = function() {};

Math.Prototype.prototype = Annotation.prototype;
Math.prototype = new Math.Prototype();
Math.prototype.constructor = Math;

module.exports = Math;

},{"../annotation/annotation":37}],95:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./node"),
  View: require("./node_view")
};

},{"./node":96,"./node_view":97}],96:[function(require,module,exports){
"use strict";

var _ = require("underscore");

// Substance.DocumentNode
// -----------------

var DocumentNode = function(node, document) {
  this.document = document;
  this.properties = node;
};

// Type definition
// --------
//

DocumentNode.type = {
  "parent": "content",
  "properties": {
  }
};

DocumentNode.Prototype = function() {

  this.toJSON = function() {
    return _.clone(this.properties);
  };

  this.getAnnotations = function() {
    return this.document.getIndex("annotations").get(this.properties.id);
  };

  this.isInstanceOf = function(type) {
    var schema = this.document.getSchema();
    return schema.isInstanceOf(this.type, type);
  };

  this.defineProperties = function(readonly) {
    if (!this.hasOwnProperty("constructor")) {
      throw new Error("Constructor property is not set. E.g.: MyNode.prototype.constructor = MyNode;");
    }
    var NodeClass = this.constructor;
    DocumentNode.defineAllProperties(NodeClass, readonly);
  };
};

DocumentNode.prototype = new DocumentNode.Prototype();
DocumentNode.prototype.constructor = DocumentNode;

DocumentNode.defineProperties = function(NodePrototype, properties, readonly) {
  _.each(properties, function(name) {
    var spec = {
      get: function() {
        return this.properties[name];
      }
    };
    if (!readonly) {
      spec["set"] = function(val) {
        this.properties[name] = val;
        return this;
      };
    }
    Object.defineProperty(NodePrototype, name, spec);
  });
};

DocumentNode.defineAllProperties = function(NodeClass, readonly) {
  DocumentNode.defineProperties(NodeClass.prototype, Object.keys(NodeClass.type.properties), readonly);
};

DocumentNode.defineProperties(DocumentNode.prototype, ["id", "type"]);

module.exports = DocumentNode;

},{"underscore":134}],97:[function(require,module,exports){
"use strict";

var View = require("substance-application").View;
var _ = require("underscore");

var __node_view_counter__ = 0;

// Substance.Node.View
// -----------------
var NodeView = function(node, viewFactory) {
  this.__id__ = __node_view_counter__++;

  View.call(this);

  this.node = node;
  this.viewFactory = viewFactory;

  this.$el.addClass('content-node').addClass(node.type);
  this.$el.attr('id', this.node.id);
};

NodeView.Prototype = function() {

  // Rendering
  // --------
  //
  this.render = function() {
    this.disposeChildViews();
    this.el.innerHTML = "";
    this.content = document.createElement("DIV");
    this.content.classList.add("content");
    this.el.appendChild(this.content);
    return this;
  };

  this.dispose = function() {
    this.stopListening();
  };

  this.disposeChildViews = function() {
    if (this.childViews) {
      _.each(this.childViews, function(view) {
        if (view) view.dispose();
      });
    }
  };

  // A general graph update listener that dispatches
  // to `this.onNodeUpdate(op)`
  // --------
  //

  this.onGraphUpdate = function(op) {
    if(op.path[0] === this.node.id && (op.type === "update" || op.type === "set") ) {
      this.onNodeUpdate(op);
      return true;
    } else {
      return false;
    }
  };

  // Callback to get noticed about updates applied to the underlying node.
  // --------
  //

  this.onNodeUpdate = function(/*op*/) {
    // do nothing by default
  };
};

NodeView.Prototype.prototype = View.prototype;
NodeView.prototype = new NodeView.Prototype();

module.exports = NodeView;

},{"substance-application":1,"underscore":134}],98:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./paragraph"),
  View: require("./paragraph_view")
};

},{"./paragraph":99,"./paragraph_view":100}],99:[function(require,module,exports){
"use strict";

var _ = require("underscore");

var DocumentNode = require("../node/node");

var Paragraph = function(node, document) {
  DocumentNode.call(this, node, document);
};

Paragraph.type = {
  "id": "paragraph",
  "parent": "content",
  "properties": {
    "children": ["array", "content"]
  }
};

// This is used for the auto-generated docs
// -----------------
//

Paragraph.description = {
  "name": "Paragraph",
  "remarks": [
    "A Paragraph can have inline elements such as images."
  ],
  "properties": {
    "children": "An array of content node references",
  }
};

// Example
// -------
//

Paragraph.example = {
  "type": "paragraph",
  "id": "paragraph_1",
  "children ": [
    "text_1",
    "image_1",
    "text_2"
  ]
};

Paragraph.Prototype = function() {

  this.getChildren = function() {
    return _.map(this.properties.children, function(id) {
      return this.document.get(id);
    }, this);
  };

};

Paragraph.Prototype.prototype = DocumentNode.prototype;
Paragraph.prototype = new Paragraph.Prototype();
Paragraph.prototype.constructor = Paragraph;

Paragraph.prototype.defineProperties();

module.exports = Paragraph;

},{"../node/node":96,"underscore":134}],100:[function(require,module,exports){
"use strict";

var NodeView = require("../node/node_view");

// Substance.Image.View
// ==========================================================================

var ParagraphView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};

ParagraphView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);
    // TODO
    return this;
  };

  this.onNodeUpdate = function(op) {
    if (op.path[0] === this.node.id && op.path[1] === "children") {
      this.render();
    }
  };
};

ParagraphView.Prototype.prototype = NodeView.prototype;
ParagraphView.prototype = new ParagraphView.Prototype();

module.exports = ParagraphView;

},{"../node/node_view":97}],101:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./remark"),
  View: require("./remark_view")
};

},{"./remark":102,"./remark_view":103}],102:[function(require,module,exports){
"use strict";

var Issue = require('../issue/issue');

var Remark = function(node, document) {
  Issue.call(this, node, document);
};

// Type definition
// --------

Remark.type = {
  "id": "remark",
  "parent": "issue",
  "properties": {
  }
};

// This is used for the auto-generated docs
// -----------------
//

Remark.description = {
  "name": "Remark",
  "remarks": [
    "References a range in a text-ish node and tags it as emphasized"
  ],
  "properties": {
  }
};

// Example Remark annotation
// -----------------
//

Remark.example = {
  "type": "remark",
  "id": "remark_1",
  "title": "Can you explain?",
  "description": "I don't get the argument here."
};

Remark.Prototype = function() {};

Remark.Prototype.prototype = Issue.prototype;
Remark.prototype = new Remark.Prototype();
Remark.prototype.constructor = Remark;

module.exports = Remark;

},{"../issue/issue":83}],103:[function(require,module,exports){
"use strict";

var IssueView = require("../issue/issue_view");

var RemarkView = function(node, viewFactory) {
  IssueView.call(this, node, viewFactory);
};

RemarkView.Prototype = function() {

};

RemarkView.Prototype.prototype = IssueView.prototype;
RemarkView.prototype = new RemarkView.Prototype();

module.exports = RemarkView;

},{"../issue/issue_view":84}],104:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./remark_reference")
};

},{"./remark_reference":105}],105:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var RemarkReference = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

RemarkReference.type = {
  "id": "remark_reference",
  "parent": "annotation",
  "properties": {
    "target": "remark"
  }
};

// This is used for the auto-generated docs
// -----------------
//

RemarkReference.description = {
  "name": "RemarkReference",
  "remarks": [
    "References a range in a text-ish node and references a remark"
  ],
  "properties": {
    "target": "Referenced remark id"
  }
};


// Example RemarkReference annotation
// -----------------
//

RemarkReference.example = {
  "type": "remark_reference_1",
  "id": "remark_reference_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

RemarkReference.Prototype = function() {};

RemarkReference.Prototype.prototype = Annotation.prototype;
RemarkReference.prototype = new RemarkReference.Prototype();
RemarkReference.prototype.constructor = RemarkReference;

RemarkReference.prototype.defineProperties();

module.exports = RemarkReference;

},{"../annotation/annotation":37}],106:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./strong")
};

},{"./strong":107}],107:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var Strong = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

Strong.type = {
  "id": "strong",
  "parent": "annotation",
  "properties": {
  }
};


// This is used for the auto-generated docs
// -----------------
//

Strong.description = {
  "name": "Strong",
  "remarks": [
    "References a range in a text-ish node and tags it as strong emphasized"
  ],
  "properties": {
  }
};


// Example Strong annotation
// -----------------
//

Strong.example = {
  "type": "strong",
  "id": "strong_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

Strong.Prototype = function() {};

Strong.Prototype.prototype = Annotation.prototype;
Strong.prototype = new Strong.Prototype();
Strong.prototype.constructor = Strong;

module.exports = Strong;

},{"../annotation/annotation":37}],108:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./subscript")
};

},{"./subscript":109}],109:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var Subscript = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

Subscript.type = {
  "id": "subscript",
  "parent": "annotation",
  "properties": {
  }
};


// This is used for the auto-generated docs
// -----------------
//

Subscript.description = {
  "name": "Subscript",
  "remarks": [
    "References a range in a text-ish node and tags it as subscript"
  ],
  "properties": {
  }
};


// Example Subscript annotation
// -----------------
//

Subscript.example = {
  "type": "subscript",
  "id": "subscript_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};

Subscript.Prototype = function() {};

Subscript.Prototype.prototype = Annotation.prototype;
Subscript.prototype = new Subscript.Prototype();
Subscript.prototype.constructor = Subscript;

module.exports = Subscript;

},{"../annotation/annotation":37}],110:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./superscript")
};

},{"./superscript":111}],111:[function(require,module,exports){
"use strict";

var Annotation = require('../annotation/annotation');

var Superscript = function(node, document) {
  Annotation.call(this, node, document);
};

// Type definition
// --------

Superscript.type = {
  "id": "superscript",
  "parent": "annotation",
  "properties": {
  }
};


// This is used for the auto-generated docs
// -----------------
//

Superscript.description = {
  "name": "Superscript",
  "remarks": [
    "References a range in a text-ish node and tags it as strong emphasized"
  ],
  "properties": {
  }
};


// Example Superscript annotation
// -----------------
//

Superscript.example = {
  "type": "strong",
  "id": "superscript_1",
  "path": [
    "text_54",
    "content"
  ],
  "range": [
    85,
    95
  ]
};


Superscript.Prototype = function() {};

Superscript.Prototype.prototype = Annotation.prototype;
Superscript.prototype = new Superscript.Prototype();
Superscript.prototype.constructor = Superscript;

module.exports = Superscript;

},{"../annotation/annotation":37}],112:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./table"),
  View: require("./table_view")
};

},{"./table":113,"./table_view":114}],113:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var DocumentNode = require("../node/node");

var Table = function(node, document) {
  DocumentNode.call(this, node, document);
};

Table.type = {
  "id": "table",
  "parent": "content",
  "properties": {
    "label": "string",
    "source_id": "string",
    "headers": ["array", "content"],
    "cells": ["array", "array", "content"],
    "caption": "content"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Table.description = {
  "name": "Table",
  "remarks": [],
  "properties": {
    "items": "An array of references which contain the content of each cell",
  }
};


// Example Formula
// -----------------
//

Table.example = {
  "type": "table",
  "id": "table_1",
  "headers": ["text_1", "text_2"],
  "cells": [
    ["cell_1_1", "cell_1_2"],
    ["cell_2_1", "cell_2_2"]
  ]
};

Table.Prototype = function() {

  this.getHeaders = function() {
    return _.map(this.properties.headers, function(id) {
      return this.document.get(id);
    }, this);
  };

  this.getCells = function() {
    var children = [];
    for (var i = 0; i < this.properties.cells.length; i++) {
      var rowIds = this.properties.cells[i];
      var row = [];
      for (var j = 0; j < rowIds.length; j++) {
        row.push(this.document.get(rowIds[j]));
      }
      children.push(row);
    }
    return children;
  };

  this.getCaption = function() {
    var caption;
    if (this.properties.caption) {
      caption = this.document.get(this.properties.caption);
    }
    return caption;
  };

};

Table.Prototype.prototype = DocumentNode.prototype;
Table.prototype = new Table.Prototype();
Table.prototype.constructor = Table;

Table.prototype.defineProperties();

// Property aliases
// ----

Object.defineProperties(Table.prototype, {
  // Used as a resource header
  header: {
    get: function() { return this.properties.label; },
    set: function() { throw new Error("This is a read-only alias property."); }
  }
});

// Construction
// ----

Table.create = function(data) {
 var result = {};

  var tableId = data.id;
  var table = {
    id: tableId,
    type: "table",
    label: data.label,
    headers: [],
    cells: []
  };

  var id, node;
  if (data.headers) {
    for (var i = 0; i < data.headers.length; i++) {
      var h = data.headers[i];
      id = "th_" + i + "_" + tableId;
      node = {
        id: id,
        type: "text",
        content: h
      };
      result[id] = node;
      table.headers.push(id);
    }
  }

  for (var row = 0; row < data.cells.length; row++) {
    var rowData = data.cells[row];
    var tableRow = [];
    for (var col = 0; col < rowData.length; col++) {
      var cell = rowData[col];
      id = "td_" + "_" + row + "_" + col + "_" + tableId;
      node = {
        id: id,
        type: "text",
        content: cell
      };
      result[id] = node;
      tableRow.push(id);
    }
    table.cells.push(tableRow);
  }

  if (data.caption) {
    id = "caption_"+ tableId;
    node = {
      id: id,
      type: "text",
      content: data.caption
    };
    result[id] = node;
    table.caption = id;
  }

  result[table.id] = table;

  return result;
};

module.exports = Table;

},{"../node/node":96,"underscore":134}],114:[function(require,module,exports){
"use strict";

var NodeView = require("../node/node_view");
var _ = require("underscore");

// TableView
// =========

var TableView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);
};

TableView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);

    // var tableEl = document.createElement("table");

    // // table header
    // var cellNode, cellView;
    // var tableHeaders = this.node.getHeaders();
    // var thead = document.createElement("thead");
    // if (tableHeaders.length > 0) {
    //   var rowEl = document.createElement("tr");
    //   for (var i = 0; i < tableHeaders.length; i++) {
    //     cellNode = tableHeaders[i];
    //     cellView = this.viewFactory.createView(cellNode);
    //     var cellEl = document.createElement("th");
    //     cellEl.appendChild(cellView.render().el);
    //     rowEl.appendChild(cellEl);

    //     this.childrenViews.push(cellView);
    //   };
    //   thead.appendChild(rowEl);
    // }
    // tableEl.appendChild(thead);

    // // table rows
    // var tableCells = this.node.getCells();
    // var tbody = document.createElement("tbody");
    // for (var row = 0; row < tableCells.length; row++) {
    //   var tableRow = tableCells[row];

    //   var rowEl = document.createElement("tr");
    //   for (var col = 0; col < tableRow.length; col++) {
    //     cellNode = tableRow[col];
    //     cellView = this.viewFactory.createView(cellNode);
    //     var cellEl = document.createElement("td");
    //     cellEl.appendChild(cellView.render().el);
    //     rowEl.appendChild(cellEl);

    //     this.childrenViews.push(cellView);
    //   }
    //   tbody.appendChild(rowEl);
    // }
    // tableEl.appendChild(tbody);

    // this.content.appendChild(tableEl);

    // // table caption
    // if (this.node.caption) {
    //   var caption = this.node.getCaption();
    //   var captionView = this.viewFactory.createView(caption);
    //   var captionEl = captionView.render().el;
    //   captionEl.classList.add("caption");
    //   this.content.appendChild(captionEl);
    //   this.childrenViews.push(captionView);
    // }

    // this.el.appendChild(this.content);

    return this;
  };

  this.onNodeUpdate = function(op) {
    if (op.path[0] === this.node.id) {
      if (op.path[1] === "headers" || op.path[1] === "cells") {
        this.render();
      }
    }
  };
};

TableView.Prototype.prototype = NodeView.prototype;
TableView.prototype = new TableView.Prototype();
TableView.prototype.constructor = TableView;

module.exports = TableView;

},{"../node/node_view":97,"underscore":134}],115:[function(require,module,exports){
"use strict";

module.exports = {
  Model: require("./text_node"),
  View: require("./text_view")
};

},{"./text_node":116,"./text_view":117}],116:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var SRegExp = require("substance-regexp");
var Operator = require('substance-operator');
var ObjectOperation = Operator.ObjectOperation;
var TextOperation = Operator.TextOperation;
var DocumentNode = require("../node/node");

// Substance.Text
// -----------------
//

var Text = function(node, document) {
  DocumentNode.call(this, node, document);
};


Text.type = {
  "id": "text",
  "parent": "content",
  "properties": {
    "source_id": "string",
    "content": "string"
  }
};


// This is used for the auto-generated docs
// -----------------
//

Text.description = {
  "name": "Text",
  "remarks": [
    "A simple text fragement that can be annotated. Usually text nodes are combined in a paragraph.",
  ],
  "properties": {
    "source_id": "Text element source id",
    "content": "Content"
  }
};


// Example Paragraph
// -----------------
//

Text.example = {
  "type": "paragraph",
  "id": "paragraph_1",
  "content": "Lorem ipsum dolor sit amet, adipiscing elit.",
};


Text.Prototype = function() {

  this.getChangePosition = function(op) {
    if (op.path[1] === "content") {
      var lastChange = Operator.Helpers.last(op.diff);
      if (lastChange.isInsert()) {
        return lastChange.pos+lastChange.length();
      } else if (lastChange.isDelete()) {
        return lastChange.pos;
      }
    }
    return -1;
  };

  this.getLength = function() {
    return this.properties.content.length;
  };

  this.insertOperation = function(charPos, text) {
    return ObjectOperation.Update([this.properties.id, "content"],
      TextOperation.Insert(charPos, text));
  };

  this.deleteOperation = function(startChar, endChar) {
    var content = this.properties.content;
    return ObjectOperation.Update([this.properties.id, "content"],
      TextOperation.Delete(startChar, content.substring(startChar, endChar)),
      "string");
  };

  this.prevWord = function(charPos) {

    var content = this.properties.content;

    // Matches all word boundaries in a string
    var wordBounds = new SRegExp(/\b\w/g).match(content);
    var prevBounds = _.select(wordBounds, function(m) {
      return m.index < charPos;
    }, this);

    // happens if there is some leading non word stuff
    if (prevBounds.length === 0) {
      return 0;
    } else {
      return _.last(prevBounds).index;
    }
  };

  this.nextWord = function(charPos) {
    var content = this.properties.content;

    // Matches all word boundaries in a string
    var wordBounds = new SRegExp(/\w\b/g).match(content.substring(charPos));

    // at the end there might be trailing stuff which is not detected as word boundary
    if (wordBounds.length === 0) {
      return content.length;
    }
    // before, there should be some boundaries
    else {
      var nextBound = wordBounds[0];
      return charPos + nextBound.index + 1;
    }
  };

  this.canJoin = function(other) {
    return (other instanceof Text);
  };

  this.join = function(doc, other) {
    var pos = this.properties.content.length;
    var text = other.content;

    doc.update([this.id, "content"], [pos, text]);
    var annotations = doc.indexes["annotations"].get(other.id);

    _.each(annotations, function(anno) {
      doc.set([anno.id, "path"], [this.properties.id, "content"]);
      doc.set([anno.id, "range"], [anno.range[0]+pos, anno.range[1]+pos]);
    }, this);
  };

  this.isBreakable = function() {
    return true;
  };

  this.break = function(doc, pos) {
    var tail = this.properties.content.substring(pos);

    // 1. Create a new node containing the tail content
    var newNode = this.toJSON();
    // letting the textish node override the type of the new node
    // e.g., a 'heading' breaks into a 'paragraph'
    newNode.type = this.splitInto ? this.splitInto : this.properties.type;
    newNode.id = doc.uuid(this.properties.type);
    newNode.content = tail;
    doc.create(newNode);

    // 2. Move all annotations
    var annotations = doc.indexes["annotations"].get(this.properties.id);
    _.each(annotations, function(annotation) {
      if (annotation.range[0] >= pos) {
        doc.set([annotation.id, "path"], [newNode.id, "content"]);
        doc.set([annotation.id, "range"], [annotation.range[0]-pos, annotation.range[1]-pos]);
      }
    });

    // 3. Trim this node's content;
    doc.update([this.properties.id, "content"], TextOperation.Delete(pos, tail));

    // return the new node
    return newNode;
  };

};

Text.Prototype.prototype = DocumentNode.prototype;
Text.prototype = new Text.Prototype();
Text.prototype.constructor = Text;

Text.prototype.defineProperties();

module.exports = Text;

},{"../node/node":96,"substance-operator":118,"substance-regexp":125,"underscore":134}],117:[function(require,module,exports){
"use strict";

var NodeView = require('../node/node_view');
var $$ = require("substance-application").$$;
var Fragmenter = require("substance-util").Fragmenter;
var Annotator = require("substance-document").Annotator;

// Substance.Text.View
// -----------------
//
// Manipulation interface shared by all textish types (paragraphs, headings)
// This behavior can overriden by the concrete node types

function _getAnnotationBehavior(doc) {
  var annotationBehavior = doc.getAnnotationBehavior();
  if (!annotationBehavior) {
    throw new Error("Missing AnnotationBehavior.");
  }
  return annotationBehavior;
}

var TextView = function(node, renderer, options) {
  NodeView.call(this, node);
  options = options || {};

  this.property = options.property || "content";

  this.$el.addClass('content-node text');

  if (node.type === "text") {
    this.$el.addClass("text-node");
  }

  // If TextView is used to display a custom property,
  // we don't have an id. Only full-fledged text nodes
  // have id's.
  if (options.property) {
    // Note: currently NodeView sets the id. In this mode the must not be set
    // as we are displaying a textish property of a node, not a text node.
    // IMO it is ok to have the id set by default, as it is the 99% case.
    this.$el.removeAttr('id');
    this.$el.removeClass('content-node');
    this.$el.addClass(options.property);
  }

  this.$el.attr('data-path', this.property);

  this._annotations = {};
  this.annotationBehavior = _getAnnotationBehavior(node.document);

  // Note: due to (nested) annotations this DOM node is fragmented
  // into several child nodes which contain a primitive DOM TextNodes.
  // We wrap each of these nodes into a Fragment object.
  // A Fragment object offers the chance to override things like the
  // interpreted length or the manipulation behavior.
  this._fragments = [];
};

var _findTextEl;

TextView.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function(enhancer) {
    NodeView.prototype.render.call(this, enhancer);

    this.renderContent();
    return this;
  };

  this.renderContent = function() {
    this.content.innerHTML = "";

    this._annotations = this.node.document.getIndex("annotations").get([this.node.id, this.property]);
    this.renderWithAnnotations(this._annotations);
  };

  this.insert = function(pos, str) {
    var result = this._lookupPostion(pos);
    var frag = result[0];
    var textNode = frag.el;
    var offset = result[1];

    var text = textNode.textContent;
    text = text.substring(0, offset) + str + text.substring(offset);
    textNode.textContent = text;

    // update the cached fragment positions
    for (var i = frag.index+1; i < this._fragments.length; i++) {
      this._fragments[i].charPos += str.length;
    }
  };

  this.delete = function(pos, length) {
    var result = this._lookupPostion(pos, "delete");
    var frag = result[0];
    var textNode = frag.el;
    var offset = result[1];

    var text = textNode.textContent;

    // can not do this incrementally if it is a greater delete
    if (offset+length >= text.length) {
      this.renderContent();
      return;
    }

    text = text.substring(0, offset) + text.substring(offset+length);
    textNode.textContent = text;

    // update the cached fragment positions
    for (var i = frag.index+1; i < this._fragments.length; i++) {
      this._fragments[i].charPos -= length;
    }
  };

  // Lookup a fragment for the given position.
  // ----
  // For insertions, the annotation level is considered on annotation boundaries,
  // i.e., if the annotation is exclusive, then the outer element/fragment is returned.
  // For deletions the annotation exclusivity is not important
  // i.e., the position belongs to the next fragment
  this._lookupPostion = function(pos, is_delete) {
    var frag, l;
    for (var i = 0; i < this._fragments.length; i++) {
      frag = this._fragments[i];
      l = frag.getLength();

      // right in the middle of a fragment
      if (pos < l) {
        return [frag, pos];
      }
      // the position is not within this fragment
      else if (pos > l) {
        pos -= l;
      }
      // ... at the boundary we consider the element's level
      else {
        var next = this._fragments[i+1];
        // if the element level of the next fragment is lower then we put the cursor there
        if (next && (next.level < frag.level || is_delete)) {
          return [next, 0];
        }
        // otherwise we leave the cursor in the current fragment
        else {
          return [frag, l];
        }
      }
    }
    return [frag, l];
  };

  this.onNodeUpdate = function(op) {
    if (op.path[1] === this.property) {
      // console.log("Updating text view: ", op);
      if (op.type === "update") {
        var update = op.diff;
        if (update.isInsert()) {
          this.insert(update.pos, update.str);
          return true;
        } else if (update.isDelete()) {
          this.delete(update.pos, update.str.length);
          return true;
        }
      } else if (op.type === "set") {
        this.renderContent();
        return true;
      }
    }
    return false;
  };

  this.onGraphUpdate = function(op) {
    // Call super handler and return if that has processed the operation already
    if (NodeView.prototype.onGraphUpdate.call(this, op)) {
      return true;
    }


    // Otherwise deal with annotation changes
    if (Annotator.changesAnnotations(this.node.document, op, [this.node.id, this.property])) {
      if (op.type === "create" || op.type === "delete") {
        console.log("Rerendering TextView due to annotation update", op);
        this.renderContent();
        return true;
      }
    }

    return false;
  };

  this.createAnnotationElement = function(entry) {
    var el;
    if (entry.type === "link") {
      el = $$('a.annotation.'+entry.type, {
        id: entry.id,
        href: this.node.document.get(entry.id).url // "http://zive.at"
      });
    } else {
      el = $$('span.annotation.'+entry.type, {
        id: entry.id
      });
    }

    return el;
  };

  this.renderWithAnnotations = function(annotations) {
    var self = this;
    var text = this.node[this.property];
    var fragment = document.createDocumentFragment();

    // this splits the text and annotations into smaller pieces
    // which is necessary to generate proper HTML.

    var fragmenter = new Fragmenter(this.annotationBehavior.levels);

    this._fragments = [];

    var _entry = null;
    var _index = 0;
    var _charPos = 0;
    var _level  = 0;

    fragmenter.onText = function(context, text) {
      var el = document.createTextNode(text);

      // Note: we create the data structures to allow lookup fragments
      // for coordinate mapping and incremental changes
      // TODO: to override the Fragment behavior we would need to override this
      self._fragments.push(new TextView.DefaultFragment(el, _index++, _charPos, _level));
      _charPos += text.length;
      context.appendChild(el);
    };

    fragmenter.onEnter = function(entry, parentContext) {
      _entry = entry;
      _level++;
      var el = self.createAnnotationElement(entry);
      parentContext.appendChild(el);
      return el;
    };

    fragmenter.onExit = function(entry, parentContext) {
      _level--;
    };

    // this calls onText and onEnter in turns...
    fragmenter.start(fragment, text, annotations);

    // set the content
    this.content.innerHTML = "";
    this.content.appendChild(fragment);
  };

  // Free the memory
  // --------

  this.dispose = function() {
    this.stopListening();
  };
};

TextView.Prototype.prototype = NodeView.prototype;
TextView.prototype = new TextView.Prototype();

var _unshiftAll = function(arr, other) {
  for (var i = 0; i < other.length; i++) {
    arr.unshift(other[i]);
  }
};

_findTextEl = function(el, pos) {
  var childNodes = [];
  _unshiftAll(childNodes, el.childNodes);

  while(childNodes.length) {
    var next = childNodes.shift();
    if (next.nodeType === Node.TEXT_NODE) {
      var t = next.textContent;
      if (t.length >= pos) {
        return [next, pos];
      } else {
        pos -= t.length;
      }
    } else {
      _unshiftAll(childNodes, next.childNodes);
    }
  }
};

TextView.Fragment = function(el, index, charPos, level) {
  this.el = el;

  // the position in the fragments array
  this.index = index;

  this.charPos = charPos;

  // Note: the level is used to determine the behavior at element boundaries.
  // Basiscally, for character positions at the boundaries, a manipulation is done
  // in the node with lower level.
  this.level = level;

};

TextView.Fragment.Prototype = function() {
  this.getLength = function() {
    throw new Error("This method is abstract");
  };
};
TextView.Fragment.prototype = new TextView.Fragment.Prototype();

TextView.DefaultFragment = function() {
  TextView.Fragment.apply(this, arguments);
};
TextView.DefaultFragment.Prototype = function() {
  this.getLength = function() {
    return this.el.length;
  };
};
TextView.DefaultFragment.Prototype.prototype = TextView.Fragment.prototype;
TextView.DefaultFragment.prototype = new TextView.DefaultFragment.Prototype();

module.exports = TextView;

},{"../node/node_view":97,"substance-application":1,"substance-document":28,"substance-util":127}],118:[function(require,module,exports){
"use strict";

module.exports = {
  Operation: require('./src/operation'),
  Compound: require('./src/compound'),
  ArrayOperation: require('./src/array_operation'),
  TextOperation: require('./src/text_operation'),
  ObjectOperation: require('./src/object_operation'),
  Helpers: require('./src/operation_helpers')
};

},{"./src/array_operation":119,"./src/compound":120,"./src/object_operation":121,"./src/operation":122,"./src/operation_helpers":123,"./src/text_operation":124}],119:[function(require,module,exports){
"use strict";

// Import
// ========

var _ = require('underscore');
var util   = require('substance-util');
var errors = util.errors;
var Operation = require('./operation');
var Compound = require('./compound');

var NOP = "NOP";
var DEL = "delete";
var INS = "insert";
var MOV = 'move';

// ArrayOperations can be used to describe changes to arrays by operations.
// ========
//
// Insertions
// --------
//
// An insertion is specified by
//    {
//      type: '+',
//      val:  <value>,
//      pos:  <position>
//    }
// or shorter:
//    ['+', <value>, <position>]
//
//
// Deletions
// --------
//
// A deletion is in the same way as Insertions but with '-' as type.
//
//    ['-', <value>, <position>]
//
// The value must be specified too as otherwise the operation would not be invertible.
//
var Move;

var ArrayOperation = function(options) {

  if (options.type === undefined) {
    throw new errors.OperationError("Illegal argument: insufficient data.");
  }

  // Insert: '+', Delete: '-', Move: '>>'
  this.type = options.type;

  if (this.type === NOP) return;

  // the position where to apply the operation
  this.pos = options.pos;

  // the string to delete or insert
  this.val = options.val;

  // Move operations have a target position
  this.target = options.target;

  // sanity checks
  if(this.type !== NOP && this.type !== INS && this.type !== DEL && this.type !== MOV) {
    throw new errors.OperationError("Illegal type.");
  }

  if (this.type === INS || this.type === DEL) {
    if (this.pos === undefined || this.val === undefined) {
      throw new errors.OperationError("Illegal argument: insufficient data.");
    }
    if (!_.isNumber(this.pos) && this.pos < 0) {
      throw new errors.OperationError("Illegal argument: expecting positive number as pos.");
    }
  } else if (this.type === MOV) {
    if (this.pos === undefined || this.target === undefined) {
      throw new errors.OperationError("Illegal argument: insufficient data.");
    }
    if (!_.isNumber(this.pos) && this.pos < 0) {
      throw new errors.OperationError("Illegal argument: expecting positive number as pos.");
    }
    if (!_.isNumber(this.target) && this.target < 0) {
      throw new errors.OperationError("Illegal argument: expecting positive number as target.");
    }
  }
};

ArrayOperation.fromJSON = function(data) {
  if (_.isArray(data)) {
    if (data[0] === MOV) {
      return new Move(data[1], data[2]);
    } else {
      return new ArrayOperation(data);
    }
  }
  if (data.type === MOV) {
    return Move.fromJSON(data);
  } else if (data.type === Compound.TYPE) {
    var ops = [];
    for (var idx = 0; idx < data.ops.length; idx ++) {
      ops.push(ArrayOperation.fromJSON(data.ops[idx]));
    }
    return ArrayOperation.Compound(ops, data.data);
  }
  else  {
    return new ArrayOperation(data);
  }
};

ArrayOperation.Prototype = function() {

  this.clone = function() {
    return new ArrayOperation(this);
  };

  this.apply = function(array) {

    if (this.type === NOP) {
      return array;
    }

    var adapter = (array instanceof ArrayOperation.ArrayAdapter) ? array : new ArrayOperation.ArrayAdapter(array);

    // Insert
    if (this.type === INS) {
      adapter.insert(this.pos, this.val);
    }
    // Delete
    else if (this.type === DEL) {
      adapter.delete(this.pos, this.val);
    }
    else {
      throw new errors.OperationError("Illegal state.");
    }
    return array;
  };

  this.invert = function() {
    var data = this.toJSON();

    if (this.type === INS) data.type = DEL;
    else if (this.type === DEL) data.type = INS;
    else if (this.type === NOP) data.type = NOP;
    else {
      throw new errors.OperationError("Illegal state.");
    }

    return new ArrayOperation(data);
  };

  this.hasConflict = function(other) {
    return ArrayOperation.hasConflict(this, other);
  };

  this.toJSON = function() {
    var result = {
      type: this.type,
    };

    if (this.type === NOP) return result;

    result.pos = this.pos;
    result.val = this.val;

    return result;
  };

  this.isInsert = function() {
    return this.type === INS;
  };

  this.isDelete = function() {
    return this.type === DEL;
  };

  this.isNOP = function() {
    return this.type === NOP;
  };

  this.isMove = function() {
    return this.type === MOV;
  };

};
ArrayOperation.Prototype.prototype = Operation.prototype;
ArrayOperation.prototype = new ArrayOperation.Prototype();

var _NOP = 0;
var _DEL = 1;
var _INS = 2;
var _MOV = 4;

var CODE = {};
CODE[NOP] = _NOP;
CODE[DEL] = _DEL;
CODE[INS] = _INS;
CODE[MOV] = _MOV;

var _hasConflict = [];

_hasConflict[_DEL | _DEL] = function(a,b) {
  return a.pos === b.pos;
};

_hasConflict[_DEL | _INS] = function() {
  return false;
};

_hasConflict[_INS | _INS] = function(a,b) {
  return a.pos === b.pos;
};

/*
  As we provide Move as quasi atomic operation we have to look at it conflict potential.

  A move is realized as composite of Delete and Insert.

  M / I: ( -> I / I conflict)

    m.s < i && m.t == i-1
    else i && m.t == i

  M / D: ( -> D / D conflict)

    m.s === d

  M / M:

    1. M/D conflict
    2. M/I conflict
*/

var hasConflict = function(a, b) {
  if (a.type === NOP || b.type === NOP) return false;
  var caseId = CODE[a.type] | CODE[b.type];

  if (_hasConflict[caseId]) {
    return _hasConflict[caseId](a,b);
  } else {
    return false;
  }
};

var transform0;

function transform_insert_insert(a, b, first) {

  if (a.pos === b.pos) {
    if (first) {
      b.pos += 1;
    } else {
      a.pos += 1;
    }
  }
  // a before b
  else if (a.pos < b.pos) {
    b.pos += 1;
  }

  // a after b
  else  {
    a.pos += 1;
  }

}

function transform_delete_delete(a, b) {

  // turn the second of two concurrent deletes into a NOP
  if (a.pos === b.pos) {
    b.type = NOP;
    a.type = NOP;
    return;
  }

  if (a.pos < b.pos) {
    b.pos -= 1;
  } else {
    a.pos -= 1;
  }

}

function transform_insert_delete(a, b) {

  // reduce to a normalized case
  if (a.type === DEL) {
    var tmp = a;
    a = b;
    b = tmp;
  }

  if (a.pos <= b.pos) {
    b.pos += 1;
  } else {
    a.pos -= 1;
  }

}

function transform_move(a, b, check, first) {
  if (a.type !== MOV) return transform_move(b, a, check, !first);

  var del = {type: DEL, pos: a.pos};
  var ins = {type: INS, pos: a.target};

  var options = {inplace: true, check:check};

  if (b.type === DEL && a.pos === b.pos) {
    a.type = NOP;
    b.pos = a.target;

  } else if (b.type === MOV && a.pos === b.pos) {
    if (first) {
      b.pos = a.target;
      a.type = NOP;
    } else {
      a.pos = b.target;
      b.type = NOP;
    }
  } else {

    if (first) {
      transform0(del, b, options);
      transform0(ins, b, options);
    } else {
      transform0(b, del, options);
      transform0(b, ins, options);
    }

    a.pos = del.pos;
    a.target = ins.pos;

  }
}

transform0 = function(a, b, options) {

  options = options || {};

  if (options.check && hasConflict(a, b)) {
    throw Operation.conflict(a, b);
  }

  if (!options.inplace) {
    a = util.clone(a);
    b = util.clone(b);
  }

  if (a.type === NOP || b.type === NOP)  {
    // nothing to transform
  }
  else if (a.type === INS && b.type === INS)  {
    transform_insert_insert(a, b, true);
  }
  else if (a.type === DEL && b.type === DEL) {
    transform_delete_delete(a, b, true);
  }
  else if (a.type === MOV || b.type === MOV) {
    transform_move(a, b, options.check, true);
  }
  else {
    transform_insert_delete(a, b, true);
  }

  return [a, b];
};

var __apply__ = function(op, array) {
  if (_.isArray(op)) {
    if (op[0] === MOV) {
      op = new Move(op[1], op[2]);
    } else {
      op = new ArrayOperation(op);
    }
  } else if (!(op instanceof ArrayOperation)) {
    op = ArrayOperation.fromJSON(op);
  }
  return op.apply(array);
};

ArrayOperation.transform = Compound.createTransform(transform0);
ArrayOperation.hasConflict = hasConflict;

ArrayOperation.perform = __apply__;
// DEPRECATED: use ArrayOperation.perform
ArrayOperation.apply = __apply__;

// Note: this is implemented manually, to avoid the value parameter
// necessary for Insert and Delete
var Move = function(source, target) {

  this.type = MOV;
  this.pos = source;
  this.target = target;

  if (!_.isNumber(this.pos) || !_.isNumber(this.target) || this.pos < 0 || this.target < 0) {
    throw new errors.OperationError("Illegal argument");
  }
};

Move.Prototype = function() {

  this.clone = function() {
    return new Move(this.pos, this.target);
  };

  this.apply = function(array) {
    if (this.type === NOP) return array;

    var adapter = (array instanceof ArrayOperation.ArrayAdapter) ? array : new ArrayOperation.ArrayAdapter(array);

    var val = array[this.pos];
    adapter.move(val, this.pos, this.target);

    return array;
  };

  this.invert = function() {
    return new Move(this.target, this.pos);
  };

  this.toJSON = function() {
    return {
      type: MOV,
      pos: this.pos,
      target: this.target
    };
  };

};
Move.Prototype.prototype = ArrayOperation.prototype;
Move.prototype = new Move.Prototype();

Move.fromJSON = function(data) {
  return new Move(data.pos, data.target);
};


// classical LCSS, implemented inplace and using traceback trick
var lcss = function(arr1, arr2) {
  var i,j;
  var L = [0];

  for (i = 0; i < arr1.length; i++) {
    for (j = 0; j < arr2.length; j++) {
      L[j+1] = L[j+1] || 0;
      if (_.isEqual(arr1[i], arr2[j])) {
        L[j+1] = Math.max(L[j+1], L[j]+1);
      } else {
        L[j+1] = Math.max(L[j+1], L[j]);
      }
    }
  }

  var seq = [];
  for (j = arr2.length; j >= 0; j--) {
    if (L[j] > L[j-1]) {
      seq.unshift(arr2[j-1]);
    }
  }

  return seq;
};


// Factory methods
// -------
//
// Note: you should use these methods instead of manually define
// an operation. This is allows us to change the underlying implementation
// without breaking your code.


ArrayOperation.Insert = function(pos, val) {
  return new ArrayOperation({type:INS, pos: pos, val: val});
};


// Factory methods
// -------
//
// Deletes an element from an array
// When array is provided value is looked up
// When pos is given, element at that position gets removed

ArrayOperation.Delete = function(posOrArray, val) {
  var pos = posOrArray;
  if (_.isArray(pos)) {
    pos = pos.indexOf(val);
  }
  if (pos < 0) return new ArrayOperation({type: NOP});
  return new ArrayOperation({type:DEL, pos: pos, val: val});
};

ArrayOperation.Move = function(pos1, pos2) {
  return new Move(pos1, pos2);
};

ArrayOperation.Push = function(arr, val) {
  var index = arr.length;
  return ArrayOperation.Insert(index, val);
};

ArrayOperation.Pop = function(arr) {
  // First we need to find a way to return values
  var index = arr.length-1;
  return ArrayOperation.Delete(index, arr[index]);
};


// Creates a compound operation that transforms the given oldArray
// into the new Array
ArrayOperation.Update = function(oldArray, newArray) {

  // 1. Compute longest common subsequence
  var seq = lcss(oldArray, newArray);

  // 2. Iterate through the three sequences and generate a sequence of
  //    retains, deletes, and inserts

  var a = seq;
  var b = oldArray;
  var c = newArray;
  var pos1, pos2, pos3;
  pos1 = 0;
  pos2 = 0;
  pos3 = 0;

  seq = [];

  while(pos2 < b.length || pos3 < c.length) {
    if (a[pos1] === b[pos2] && b[pos2] === c[pos3]) {
      pos1++; pos2++; pos3++;
      seq.push(1);
    } else if (a[pos1] === b[pos2]) {
      seq.push(['+', c[pos3++]]);
    } else {
      seq.push(['-', b[pos2++]]);
    }
  }

  // 3. Create a compound for the computed sequence

  return ArrayOperation.Sequence(seq);
};

ArrayOperation.Compound = function(ops, data) {
  // do not create a Compound if not necessary
  if (ops.length === 1 && !data) return ops[0];
  else return new Compound(ops, data);
};

// Convenience factory method to create an operation that clears the given array.
// --------
//

ArrayOperation.Clear = function(arr) {
  var ops = [];
  for (var idx = 0; idx < arr.length; idx++) {
    ops.push(ArrayOperation.Delete(0, arr[idx]));
  }
  return ArrayOperation.Compound(ops);
};



// Convenience factory method to create an incremental complex array update.
// --------
//
// Example:
//  Input:
//    [1,2,3,4,5,6,7]
//  Sequence:
//    [2, ['-', 3], 2, ['+', 8]]
//  Output:
//    [1,2,4,5,8,6,7]
//
// Syntax:
//
//  - positive Number: skip / retain
//  - tuple ['-', <val>]: delete element at current position
//  - tuple ['+', <val>]: insert element at current position

ArrayOperation.Sequence = function(seq) {
  var pos = 0;
  var ops = [];

  for (var idx = 0; idx < seq.length; idx++) {
    var s = seq[idx];

    if (_.isNumber(s) && s > 0) {
      pos += s;
    } else {
      if (s[0] === "+") {
        ops.push(ArrayOperation.Insert(pos, s[1]));
        pos+=1;
      } else if (s[0] === "-") {
        ops.push(ArrayOperation.Delete(pos, s[1]));
      } else {
        throw new errors.OperationError("Illegal operation.");
      }
    }
  }

  return new Compound(ops);
};

ArrayOperation.create = function(array, spec) {
  var type = spec[0];
  var val, pos;
  if (type === INS || type === "+") {
    pos = spec[1];
    val = spec[2];
    return ArrayOperation.Insert(pos, val);
  } else if (type === DEL || type === "-") {
    pos = spec[1];
    val = array[pos];
    return ArrayOperation.Delete(pos, val);
  } else if (type === MOV || type === ">>") {
    pos = spec[1];
    var target = spec[2];
    return ArrayOperation.Move(pos, target);
  } else {
    throw new errors.OperationError("Illegal specification.");
  }
};

var ArrayAdapter = function(arr) {
  this.array = arr;
};

ArrayAdapter.prototype = {
  insert: function(pos, val) {
    if (this.array.length < pos) {
      throw new errors.OperationError("Provided array is too small.");
    }
    this.array.splice(pos, 0, val);
  },

  delete: function(pos, val) {
    if (this.array.length < pos) {
      throw new errors.OperationError("Provided array is too small.");
    }
    if (this.array[pos] !== val) {
      throw new errors.OperationError("Unexpected value at position " + pos + ". Expected " + val + ", found " + this.array[pos]);
    }
    this.array.splice(pos, 1);
  },

  move: function(val, pos, to) {
    if (this.array.length < pos) {
      throw new errors.OperationError("Provided array is too small.");
    }
    this.array.splice(pos, 1);

    if (this.array.length < to) {
      throw new errors.OperationError("Provided array is too small.");
    }
    this.array.splice(to, 0, val);
  }
};
ArrayOperation.ArrayAdapter = ArrayAdapter;

ArrayOperation.NOP = NOP;
ArrayOperation.DELETE = DEL;
ArrayOperation.INSERT = INS;
ArrayOperation.MOVE = MOV;

// Export
// ========

module.exports = ArrayOperation;

},{"./compound":120,"./operation":122,"substance-util":127,"underscore":134}],120:[function(require,module,exports){
"use strict";

// Import
// ========

var _    = require('underscore');
var util   = require('substance-util');
var Operation = require('./operation');

// Module
// ========

var COMPOUND = "compound";

var Compound = function(ops, data) {
  this.type = COMPOUND;
  this.ops = ops;
  this.alias = undefined;
  this.data = data;

  if (!ops || ops.length === 0) {
    throw new Operation.OperationError("No operations given.");
  }
};

Compound.Prototype = function() {

  this.clone = function() {
    var ops = [];
    for (var idx = 0; idx < this.ops.length; idx++) {
      ops.push(util.clone(this.ops[idx]));
    }
    return new Compound(ops, util.clone(this.data));
  };

  this.apply = function(obj) {
    for (var idx = 0; idx < this.ops.length; idx++) {
      obj = this.ops[idx].apply(obj);
    }
    return obj;
  };

  this.invert = function() {
    var ops = [];
    for (var idx = 0; idx < this.ops.length; idx++) {
      // reverse the order of the inverted atomic commands
      ops.unshift(this.ops[idx].invert());
    }
    return new Compound(ops, this.data);
  };

  this.toJSON = function() {
    var result = {
      type: COMPOUND,
      ops: this.ops,
    };
    if (this.alias) result.alias = this.alias;
    if (this.data) result.data = this.data;
    return result;
  };

};
Compound.Prototype.prototype = Operation.prototype;
Compound.prototype = new Compound.Prototype();

Compound.TYPE = COMPOUND;

// Transforms a compound and another given change inplace.
// --------
//

var compound_transform = function(a, b, first, check, transform0) {
  var idx;

  if (b.type === COMPOUND) {
    for (idx = 0; idx < b.ops.length; idx++) {
      compound_transform(a, b.ops[idx], first, check, transform0);
    }
  }

  else {
    for (idx = 0; idx < a.ops.length; idx++) {
      var _a, _b;
      if (first) {
        _a = a.ops[idx];
        _b = b;
      } else {
        _a = b;
        _b = a.ops[idx];
      }
      transform0(_a, _b, {inplace: true, check: check});
    }
  }
};

// A helper to create a transform method that supports Compounds.
// --------
//

Compound.createTransform = function(primitive_transform) {
  return function(a, b, options) {
    options = options || {};
    if(a.type === COMPOUND || b.type === COMPOUND) {
      if (!options.inplace) {
        a = util.clone(a);
        b = util.clone(b);
      }
      if (a.type === COMPOUND) {
        compound_transform(a, b, true, options.check, primitive_transform);
      } else if (b.type === COMPOUND) {
        compound_transform(b, a, false, options.check, primitive_transform);
      }
      return [a, b];
    } else {
      return primitive_transform(a, b, options);
    }

  };
};

// Export
// ========

module.exports = Compound;

},{"./operation":122,"substance-util":127,"underscore":134}],121:[function(require,module,exports){
"use strict";

// Import
// ========

var _ = require('underscore');
var util = require('substance-util');
var errors = util.errors;
var Operation = require('./operation');
var Compound = require('./compound');
var TextOperation = require('./text_operation');
var ArrayOperation = require('./array_operation');

var NOP = "NOP";
var CREATE = "create";
var DELETE = 'delete';
var UPDATE = 'update';
var SET = 'set';

var ObjectOperation = function(data) {

  this.type = data.type;
  this.path = data.path;

  if (this.type === CREATE || this.type === DELETE) {
    this.val = data.val;
  }

  // Updates can be given as value or as Operation (Text, Array)
  else if (this.type === UPDATE) {
    if (data.diff !== undefined) {
      this.diff = data.diff;
      this.propertyType = data.propertyType;
    } else {
      throw new errors.OperationError("Illegal argument: update by value or by diff must be provided");
    }
  }

  else if (this.type === SET) {
    this.val = data.val;
    this.original = data.original;
  }
};

ObjectOperation.fromJSON = function(data) {
  if (data.type === Compound.TYPE) {
    var ops = [];
    for (var idx = 0; idx < data.ops.length; idx++) {
      ops.push(ObjectOperation.fromJSON(data.ops[idx]));
    }
    return ObjectOperation.Compound(ops, data.data);

  } else {
    var op = new ObjectOperation(data);
    if (data.type === "update") {
      switch (data.propertyType) {
      case "string":
        op.diff = TextOperation.fromJSON(op.diff);
        break;
      case "array":
        op.diff = ArrayOperation.fromJSON(op.diff);
        break;
      default:
        throw new Error("Don't know how to deserialize this operation:" + JSON.stringify(data));
      }
    }
    return op;
  }
};

ObjectOperation.Prototype = function() {

  this.clone = function() {
    return new ObjectOperation(this);
  };

  this.isNOP = function() {
    if (this.type === NOP) return true;
    else if (this.type === UPDATE) return this.diff.isNOP();
  };

  this.apply = function(obj) {
    if (this.type === NOP) return obj;

    // Note: this allows to use a custom adapter implementation
    // to support other object like backends
    var adapter = (obj instanceof ObjectOperation.Object) ? obj : new ObjectOperation.Object(obj);

    if (this.type === CREATE) {
      // clone here as the operations value must not be changed
      adapter.create(this.path, util.clone(this.val));
      return obj;
    }

    var val = adapter.get(this.path);

    if (this.type === DELETE) {
      // TODO: maybe we could tolerate such deletes
      if (val === undefined) {
        throw new errors.OperationError("Property " + JSON.stringify(this.path) + " not found.");
      }
      adapter.delete(this.path, val);
    }

    else if (this.type === UPDATE) {
      if (this.propertyType === 'object') {
        val = ObjectOperation.apply(this.diff, val);
        if(!adapter.inplace()) adapter.update(this.path, val, this.diff);
      }
      else if (this.propertyType === 'array') {
        val = ArrayOperation.apply(this.diff, val);
        if(!adapter.inplace()) adapter.update(this.path, val, this.diff);
      }
      else if (this.propertyType === 'string') {
        val = TextOperation.apply(this.diff, val);
        adapter.update(this.path, val, this.diff);
      }
      else {
        throw new errors.OperationError("Unsupported type for operational update.");
      }
    }

    else if (this.type === SET) {
      // clone here as the operations value must not be changed
      adapter.set(this.path, util.clone(this.val));
    }

    else {
      throw new errors.OperationError("Illegal state.");
    }

    return obj;
  };

  this.invert = function() {

    if (this.type === NOP) {
      return { type: NOP };
    }

    var result = new ObjectOperation(this);

    if (this.type === CREATE) {
      result.type = DELETE;
    }

    else if (this.type === DELETE) {
      result.type = CREATE;
    }

    else if (this.type === UPDATE) {
      var invertedDiff;
      if (this.propertyType === 'string') {
        invertedDiff = TextOperation.fromJSON(this.diff).invert();
      }
      else if (this.propertyType === 'array') {
        invertedDiff = ArrayOperation.fromJSON(this.diff).invert();
      }
      result.diff = invertedDiff;
      result.propertyType = this.propertyType;
    }

    else if (this.type === SET) {
      result.val = this.original;
      result.original = this.val;
    }

    else {
      throw new errors.OperationError("Illegal state.");
    }

    return result;
  };

  this.hasConflict = function(other) {
    return ObjectOperation.hasConflict(this, other);
  };

  this.toJSON = function() {

    if (this.type === NOP) {
      return {
        type: NOP
      };
    }

    var data = {
      type: this.type,
      path: this.path,
    };

    if (this.type === CREATE || this.type === DELETE) {
      data.val = this.val;
    }

    else if (this.type === UPDATE) {
      data.diff = this.diff;
      data.propertyType = this.propertyType;
    }

    else if (this.type === SET) {
      data.val = this.val;
      data.original = this.original;
    }

    return data;
  };

};
ObjectOperation.Prototype.prototype = Operation.prototype;
ObjectOperation.prototype = new ObjectOperation.Prototype();

ObjectOperation.Object = function(obj) {
  this.obj = obj;
};

ObjectOperation.Object.Prototype = function() {

  function resolve(self, obj, path, create) {
    var item = obj;
    var idx = 0;
    for (; idx < path.length-1; idx++) {
      if (item === undefined) {
        throw new Error("Key error: could not find element for path " + JSON.stringify(self.path));
      }

      if (item[path[idx]] === undefined && create) {
        item[path[idx]] = {};
      }

      item = item[path[idx]];
    }
    return {parent: item, key: path[idx]};
  }

  this.get = function(path) {
    var item = resolve(this, this.obj, path);
    return item.parent[item.key];
  };

  this.create = function(path, value) {
    var item = resolve(this, this.obj, path, true);
    if (item.parent[item.key] !== undefined) {
      throw new errors.OperationError("Value already exists. path =" + JSON.stringify(path));
    }
    item.parent[item.key] = value;
  };

  // Note: in the default implementation we do not need the diff
  this.update = function(path, value, diff) {
    this.set(path, value);
  };

  this.set = function(path, value) {
    var item = resolve(this, this.obj, path);
    item.parent[item.key] = value;
  };

  this.delete = function(path) {
    var item = resolve(this, this.obj, path);
    delete item.parent[item.key];
  };

  this.inplace = function() {
    return true;
  };

};
ObjectOperation.Object.prototype = new ObjectOperation.Object.Prototype();


var hasConflict = function(a, b) {
  if (a.type === NOP || b.type === NOP) return false;

  return _.isEqual(a.path, b.path);
};

var transform_delete_delete = function(a, b) {
  // both operations have the same effect.
  // the transformed operations are turned into NOPs
  a.type = NOP;
  b.type = NOP;
};

var transform_create_create = function() {
  // TODO: maybe it would be possible to create an differntial update that transforms the one into the other
  // However, we fail for now.
  throw new errors.OperationError("Can not transform two concurring creates of the same property");
};

var transform_delete_create = function(a, b, flipped) {
  if (a.type !== DELETE) {
    return transform_delete_create(b, a, true);
  }

  if (!flipped) {
    a.type = NOP;
  } else {
    a.val = b.val;
    b.type = NOP;
  }
};

var transform_delete_update = function(a, b, flipped) {
  if (a.type !== DELETE) {
    return transform_delete_update(b, a, true);
  }

  var op;
  if (b.propertyType === 'string') {
    op = TextOperation.fromJSON(b.diff);
  } else if (b.propertyType === 'array') {
    op = ArrayOperation.fromJSON(b.diff);
  }

  // (DELETE, UPDATE) is transformed into (DELETE, CREATE)
  if (!flipped) {
    a.type = NOP;
    b.type = CREATE;
    b.val = op.apply(a.val);
  }
  // (UPDATE, DELETE): the delete is updated to delete the updated value
  else {
    a.val = op.apply(a.val);
    b.type = NOP;
  }

};

var transform_create_update = function() {
  // it is not possible to reasonably transform this.
  throw new errors.OperationError("Can not transform a concurring create and update of the same property");
};

var transform_update_update = function(a, b) {

  // Note: this is a conflict the user should know about

  var op_a, op_b, t;
  if (b.propertyType === 'string') {
    op_a = TextOperation.fromJSON(a.diff);
    op_b = TextOperation.fromJSON(b.diff);
    t = TextOperation.transform(op_a, op_b, {inplace: true});
  } else if (b.propertyType === 'array') {
    op_a = ArrayOperation.fromJSON(a.diff);
    op_b = ArrayOperation.fromJSON(b.diff);
    t = ArrayOperation.transform(op_a, op_b, {inplace: true});
  } else if (b.propertyType === 'object') {
    op_a = ObjectOperation.fromJSON(a.diff);
    op_b = ObjectOperation.fromJSON(b.diff);
    t = ObjectOperation.transform(op_a, op_b, {inplace: true});
  }

  a.diff = t[0];
  b.diff = t[1];
};

var transform_create_set = function(a, b, flipped) {
  if (a.type !== CREATE) return transform_create_set(b, a, true);

  if (!flipped) {
    a.type = NOP;
    b.original = a.val;
  } else {
    a.type = SET;
    a.original = b.val;
    b.type = NOP;
  }

};

var transform_delete_set = function(a, b, flipped) {
  if (a.type !== DELETE) return transform_delete_set(b, a, true);

  if (!flipped) {
    a.type = NOP;
    b.type = CREATE;
    b.original = undefined;
  } else {
    a.val = b.val;
    b.type = NOP;
  }

};

var transform_update_set = function() {
  throw new errors.OperationError("Can not transform update/set of the same property.");
};

var transform_set_set = function(a, b) {
  a.type = NOP;
  b.original = a.val;
};

var _NOP = 0;
var _CREATE = 1;
var _DELETE = 2;
var _UPDATE = 4;
var _SET = 8;

var CODE = {};
CODE[NOP] =_NOP;
CODE[CREATE] = _CREATE;
CODE[DELETE] = _DELETE;
CODE[UPDATE] = _UPDATE;
CODE[SET] = _SET;

var __transform__ = [];
__transform__[_DELETE | _DELETE] = transform_delete_delete;
__transform__[_DELETE | _CREATE] = transform_delete_create;
__transform__[_DELETE | _UPDATE] = transform_delete_update;
__transform__[_CREATE | _CREATE] = transform_create_create;
__transform__[_CREATE | _UPDATE] = transform_create_update;
__transform__[_UPDATE | _UPDATE] = transform_update_update;
__transform__[_CREATE | _SET   ] = transform_create_set;
__transform__[_DELETE | _SET   ] = transform_delete_set;
__transform__[_UPDATE | _SET   ] = transform_update_set;
__transform__[_SET    | _SET   ] = transform_set_set;

var transform = function(a, b, options) {

  options = options || {};

  var conflict = hasConflict(a, b);

  if (options.check && conflict) {
    throw Operation.conflict(a, b);
  }

  if (!options.inplace) {
    a = util.clone(a);
    b = util.clone(b);
  }

  // without conflict: a' = a, b' = b
  if (!conflict) {
    return [a, b];
  }

  __transform__[CODE[a.type] | CODE[b.type]](a,b);

  return [a, b];
};

ObjectOperation.transform = Compound.createTransform(transform);
ObjectOperation.hasConflict = hasConflict;

var __apply__ = function(op, obj) {
  if (!(op instanceof ObjectOperation)) {
    op = ObjectOperation.fromJSON(op);
  }
  return op.apply(obj);
};

// TODO: rename to "exec" or perform
ObjectOperation.apply = __apply__;

ObjectOperation.Create = function(path, val) {
  return new ObjectOperation({type: CREATE, path: path, val: val});
};

ObjectOperation.Delete = function(path, val) {
  return new ObjectOperation({type: DELETE, path: path, val: val});
};

function guessPropertyType(op) {

  if (op instanceof Compound) {
    return guessPropertyType(op.ops[0]);
  }
  if (op instanceof TextOperation) {
    return "string";
  }
  else if (op instanceof ArrayOperation) {
    return  "array";
  }
  else {
    return "other";
  }
}

ObjectOperation.Update = function(path, diff, propertyType) {
  propertyType = propertyType || guessPropertyType(diff);

  return new ObjectOperation({
    type: UPDATE,
    path: path,
    diff: diff,
    propertyType: propertyType
  });
};

ObjectOperation.Set = function(path, oldVal, newVal) {
  return new ObjectOperation({
    type: SET,
    path: path,
    val: util.clone(newVal),
    original: util.clone(oldVal)
  });
};

ObjectOperation.Compound = function(ops, data) {
  if (ops.length === 0) return null;
  else return new Compound(ops, data);
};

// TODO: this can not deal with cyclic references
var __extend__ = function(obj, newVals, path, deletes, creates, updates) {
  var keys = Object.getOwnPropertyNames(newVals);

  for (var idx = 0; idx < keys.length; idx++) {
    var key = keys[idx];
    var p = path.concat(key);

    if (newVals[key] === undefined && obj[key] !== undefined) {
      deletes.push(ObjectOperation.Delete(p, obj[key]));

    } else if (_.isObject(newVals[key])) {

      // TODO: for now, the structure must be the same
      if (!_.isObject(obj[key])) {
        throw new errors.OperationError("Incompatible arguments: newVals must have same structure as obj.");
      }
      __extend__(obj[key], newVals[key], p, deletes, creates, updates);

    } else {
      if (obj[key] === undefined) {
        creates.push(ObjectOperation.Create(p, newVals[key]));
      } else {
        var oldVal = obj[key];
        var newVal = newVals[key];
        if (!_.isEqual(oldVal, newVal)) {
          updates.push(ObjectOperation.Set(p, oldVal, newVal));
        }
      }
    }
  }
};

ObjectOperation.Extend = function(obj, newVals) {
  var deletes = [];
  var creates = [];
  var updates = [];
  __extend__(obj, newVals, [], deletes, creates, updates);
  return ObjectOperation.Compound(deletes.concat(creates).concat(updates));
};

ObjectOperation.NOP = NOP;
ObjectOperation.CREATE = CREATE;
ObjectOperation.DELETE = DELETE;
ObjectOperation.UPDATE = UPDATE;
ObjectOperation.SET = SET;

// Export
// ========

module.exports = ObjectOperation;

},{"./array_operation":119,"./compound":120,"./operation":122,"./text_operation":124,"substance-util":127,"underscore":134}],122:[function(require,module,exports){
"use strict";

// Import
// ========

var util   = require('substance-util');
var errors   = util.errors;

var OperationError = errors.define("OperationError", -1);
var Conflict = errors.define("Conflict", -1);

var Operation = function() {};

Operation.Prototype = function() {

  this.clone = function() {
    throw new Error("Not implemented.");
  };

  this.apply = function() {
    throw new Error("Not implemented.");
  };

  this.invert = function() {
    throw new Error("Not implemented.");
  };

  this.hasConflict = function() {
    throw new Error("Not implemented.");
  };

};

Operation.prototype = new Operation.Prototype();

Operation.conflict = function(a, b) {
  var conflict = new errors.Conflict("Conflict: " + JSON.stringify(a) +" vs " + JSON.stringify(b));
  conflict.a = a;
  conflict.b = b;
  return conflict;
};

Operation.OperationError = OperationError;
Operation.Conflict = Conflict;

// Export
// ========

module.exports = Operation;

},{"substance-util":127}],123:[function(require,module,exports){
"use strict";

var TextOperation = require("./text_operation");
var ArrayOperation = require("./array_operation");

var Helpers = {};

Helpers.last = function(op) {
  if (op.type === "compound") {
    return op.ops[op.ops.length-1];
  }
  return op;
};

// Iterates all atomic operations contained in a given operation
// --------
//
// - op: an Operation instance
// - iterator: a `function(op)`
// - context: the `this` context for the iterator function
// - reverse: if present, the operations are iterated reversely

Helpers.each = function(op, iterator, context, reverse) {
  if (op.type === "compound") {
    var l = op.ops.length;
    for (var i = 0; i < l; i++) {
      var child = op.ops[i];
      if (reverse) {
        child = op.ops[l-i-1];
      }
      if (child.type === "compound") {
        if (Helpers.each(child, iterator, context, reverse) === false) {
          return false;
        }
      }
      else {
        if (iterator.call(context, child) === false) {
          return false;
        }
      }
    }
    return true;
  } else {
    return iterator.call(context, op);
  }
};

Helpers.invert = function(op, type) {
  switch (type) {
  case "string":
    return TextOperation.fromJSON(op).invert();
  case "array":
    return ArrayOperation.fromJSON(op).invert();
  default:
    throw new Error("Don't know how to invert this operation.");
  }
};

module.exports = Helpers;

},{"./array_operation":119,"./text_operation":124}],124:[function(require,module,exports){
"use strict";

// Import
// ========

var _ = require('underscore');
var util = require('substance-util');
var errors = util.errors;
var Operation = require('./operation');
var Compound = require('./compound');


var INS = "+";
var DEL = "-";

var TextOperation = function(options) {

  // if this operation should be created using an array
  if (_.isArray(options)) {
    options = {
      type: options[0],
      pos: options[1],
      str: options[2]
    };
  }

  if (options.type === undefined || options.pos === undefined || options.str === undefined) {
    throw new errors.OperationError("Illegal argument: insufficient data.");
  }

  // '+' or '-'
  this.type = options.type;

  // the position where to apply the operation
  this.pos = options.pos;

  // the string to delete or insert
  this.str = options.str;

  // sanity checks
  if(!this.isInsert() && !this.isDelete()) {
    throw new errors.OperationError("Illegal type.");
  }
  if (!_.isString(this.str)) {
    throw new errors.OperationError("Illegal argument: expecting string.");
  }
  if (!_.isNumber(this.pos) && this.pos < 0) {
    throw new errors.OperationError("Illegal argument: expecting positive number as pos.");
  }
};

TextOperation.fromJSON = function(data) {

  if (data.type === Compound.TYPE) {
    var ops = [];
    for (var idx = 0; idx < data.ops.length; idx++) {
      ops.push(TextOperation.fromJSON(data.ops[idx]));
    }
    return TextOperation.Compound(ops,data.data);

  } else {
    return new TextOperation(data);
  }
};

TextOperation.Prototype = function() {

  this.clone = function() {
    return new TextOperation(this);
  };

  this.isNOP = function() {
    return this.type === "NOP" || this.str.length === 0;
  };

  this.isInsert = function() {
    return this.type === INS;
  };

  this.isDelete = function() {
    return this.type === DEL;
  };

  this.length = function() {
    return this.str.length;
  };

  this.apply = function(str) {
    if (this.isEmpty()) return str;

    var adapter = (str instanceof TextOperation.StringAdapter) ? str : new TextOperation.StringAdapter(str);

    if (this.type === INS) {
      adapter.insert(this.pos, this.str);
    }
    else if (this.type === DEL) {
      adapter.delete(this.pos, this.str.length);
    }
    else {
      throw new errors.OperationError("Illegal operation type: " + this.type);
    }

    return adapter.get();
  };

  this.invert = function() {
    var data = {
      type: this.isInsert() ? '-' : '+',
      pos: this.pos,
      str: this.str
    };
    return new TextOperation(data);
  };

  this.hasConflict = function(other) {
    return TextOperation.hasConflict(this, other);
  };

  this.isEmpty = function() {
    return this.str.length === 0;
  };

  this.toJSON = function() {
    return {
      type: this.type,
      pos: this.pos,
      str: this.str
    };
  };

};
TextOperation.Prototype.prototype = Operation.prototype;
TextOperation.prototype = new TextOperation.Prototype();

var hasConflict = function(a, b) {

  // Insert vs Insert:
  //
  // Insertions are conflicting iff their insert position is the same.

  if (a.type === INS && b.type === INS)  return (a.pos === b.pos);

  // Delete vs Delete:
  //
  // Deletions are conflicting if their ranges overlap.

  if (a.type === DEL && b.type === DEL) {
    // to have no conflict, either `a` should be after `b` or `b` after `a`, otherwise.
    return !(a.pos >= b.pos + b.str.length || b.pos >= a.pos + a.str.length);
  }

  // Delete vs Insert:
  //
  // A deletion and an insertion are conflicting if the insert position is within the deleted range.

  var del, ins;
  if (a.type === DEL) {
    del = a; ins = b;
  } else {
    del = b; ins = a;
  }

  return (ins.pos >= del.pos && ins.pos < del.pos + del.str.length);
};

// Transforms two Insertions
// --------

function transform_insert_insert(a, b, first) {

  if (a.pos === b.pos) {
    if (first) {
      b.pos += a.str.length;
    } else {
      a.pos += b.str.length;
    }
  }

  else if (a.pos < b.pos) {
    b.pos += a.str.length;
  }

  else {
    a.pos += b.str.length;
  }

}

// Transform two Deletions
// --------
//

function transform_delete_delete(a, b, first) {

  // reduce to a normalized case
  if (a.pos > b.pos) {
    return transform_delete_delete(b, a, !first);
  }

  if (a.pos === b.pos && a.str.length > b.str.length) {
    return transform_delete_delete(b, a, !first);
  }


  // take out overlapping parts
  if (b.pos < a.pos + a.str.length) {
    var s = b.pos - a.pos;
    var s1 = a.str.length - s;
    var s2 = s + b.str.length;

    a.str = a.str.slice(0, s) + a.str.slice(s2);
    b.str = b.str.slice(s1);
    b.pos -= s;
  } else {
    b.pos -= a.str.length;
  }

}

// Transform Insert and Deletion
// --------
//

function transform_insert_delete(a, b) {

  if (a.type === DEL) {
    return transform_insert_delete(b, a);
  }

  // we can assume, that a is an insertion and b is a deletion

  // a is before b
  if (a.pos <= b.pos) {
    b.pos += a.str.length;
  }

  // a is after b
  else if (a.pos >= b.pos + b.str.length) {
    a.pos -= b.str.length;
  }

  // Note: this is a conflict case the user should be noticed about
  // If applied still, the deletion takes precedence
  // a.pos > b.pos && <= b.pos + b.length()
  else {
    var s = a.pos - b.pos;
    b.str = b.str.slice(0, s) + a.str + b.str.slice(s);
    a.str = "";
  }

}

var transform0 = function(a, b, options) {

  options = options || {};

  if (options.check && hasConflict(a, b)) {
    throw Operation.conflict(a, b);
  }

  if (!options.inplace) {
    a = util.clone(a);
    b = util.clone(b);
  }

  if (a.type === INS && b.type === INS)  {
    transform_insert_insert(a, b, true);
  }
  else if (a.type === DEL && b.type === DEL) {
    transform_delete_delete(a, b, true);
  }
  else {
    transform_insert_delete(a,b);
  }

  return [a, b];
};

var __apply__ = function(op, array) {
  if (_.isArray(op)) {
    op = new TextOperation(op);
  }
  else if (!(op instanceof TextOperation)) {
    op = TextOperation.fromJSON(op);
  }
  return op.apply(array);
};

TextOperation.transform = Compound.createTransform(transform0);
TextOperation.apply = __apply__;

var StringAdapter = function(str) {
  this.str = str;
};
StringAdapter.prototype = {
  insert: function(pos, str) {
    if (this.str.length < pos) {
      throw new errors.OperationError("Provided string is too short.");
    }
    this.str = this.str.slice(0, pos) + str + this.str.slice(pos);
  },

  delete: function(pos, length) {
    if (this.str.length < pos + length) {
      throw new errors.OperationError("Provided string is too short.");
    }
    this.str = this.str.slice(0, pos) + this.str.slice(pos + length);
  },

  get: function() {
    return this.str;
  }
};

TextOperation.Insert = function(pos, str) {
  return new TextOperation(["+", pos, str]);
};

TextOperation.Delete = function(pos, str) {
  return new TextOperation(["-", pos, str]);
};

TextOperation.Compound = function(ops, data) {
  // do not create a Compound if not necessary
  if (ops.length === 1 && !data) return ops[0];
  else return new Compound(ops, data);
};

// Converts from a given a sequence in the format of Tim's lib
// which is an array of numbers and strings.
// 1. positive number: retain a number of characters
// 2. negative number: delete a string with the given length at the current position
// 3. string: insert the given string at the current position

TextOperation.fromOT = function(str, ops) {

  var atomicOps = []; // atomic ops

  // iterating through the sequence and bookkeeping the position
  // in the source and destination str
  var srcPos = 0,
      dstPos = 0;

  if (!_.isArray(ops)) {
    ops = _.toArray(arguments).slice(1);
  }

  _.each(ops, function(op) {
    if (_.isString(op)) { // insert chars
      atomicOps.push(TextOperation.Insert(dstPos, op));
      dstPos += op.length;
    } else if (op<0) { // delete n chars
      var n = -op;
      atomicOps.push(TextOperation.Delete(dstPos, str.slice(srcPos, srcPos+n)));
      srcPos += n;
    } else { // skip n chars
      srcPos += op;
      dstPos += op;
    }
  });

  if (atomicOps.length === 0) {
    return null;
  }

  return TextOperation.Compound(atomicOps);
};

TextOperation.fromSequence = TextOperation.fromOT;

// A helper class to model Text selections and to provide an easy way
// to bookkeep changes by other applied TextOperations
var Range = function(range) {
  if (_.isArray(range)) {
    this.start = range[0];
    this.length = range[1];
  } else {
    this.start = range.start;
    this.length = range.length;
  }
};

// Transforms a given range tuple (offset, length) in-place.
// --------
//

var range_transform = function(range, textOp, expandLeft, expandRight) {

  var changed = false;

  // handle compound operations
  if (textOp.type === Compound.TYPE) {
    for (var idx = 0; idx < textOp.ops.length; idx++) {
      var op = textOp.ops[idx];
      range_transform(range, op);
    }
    return;
  }


  var start, end;

  if (_.isArray(range)) {
    start = range[0];
    end = range[1];
  } else {
    start = range.start;
    end = start + range.length;
  }

  // Delete
  if (textOp.type === DEL) {
    var pos1 = textOp.pos;
    var pos2 = textOp.pos+textOp.str.length;

    if (pos1 <= start) {
      start -= Math.min(pos2-pos1, start-pos1);
      changed = true;
    }
    if (pos1 <= end) {
      end -= Math.min(pos2-pos1, end-pos1);
      changed = true;
    }

  } else if (textOp.type === INS) {
    var pos = textOp.pos;
    var l = textOp.str.length;

    if ( (pos < start) ||
         (pos === start && !expandLeft) ) {
      start += l;
      changed = true;
    }

    if ( (pos < end) ||
         (pos === end && expandRight) ) {
      end += l;
      changed = true;
    }
  }

  if (changed) {
    if (_.isArray(range)) {
      range[0] = start;
      range[1] = end;
    } else {
      range.start = start;
      range.length = end - start;
    }
  }

  return changed;
};

Range.Prototype = function() {

  this.clone = function() {
    return new Range(this);
  };

  this.toJSON = function() {
    var result = {
      start: this.start,
      length: this.length
    };
    // if (this.expand) result.expand = true;
    return result;
  };

  this.transform = function(textOp, expand) {
    return range_transform(this.range, textOp, expand);
  };

};
Range.prototype = new Range.Prototype();

Range.transform = function(range, op, expandLeft, expandRight) {
  return range_transform(range, op, expandLeft, expandRight);
};

Range.fromJSON = function(data) {
  return new Range(data);
};

TextOperation.StringAdapter = StringAdapter;
TextOperation.Range = Range;
TextOperation.INSERT = INS;
TextOperation.DELETE = DEL;

// Export
// ========

module.exports = TextOperation;

},{"./compound":120,"./operation":122,"substance-util":127,"underscore":134}],125:[function(require,module,exports){
"use strict";

module.exports = require("./src/regexp");

},{"./src/regexp":126}],126:[function(require,module,exports){
"use strict";

// Substanc.RegExp.Match
// ================
//
// Regular expressions in Javascript they way they should be.

var Match = function(match) {
  this.index = match.index;
  this.match = [];

  for (var i=0; i < match.length; i++) {
    this.match.push(match[i]);
  }
};

Match.Prototype = function() {

  // Returns the capture groups
  // --------
  //

  this.captures = function() {
    return this.match.slice(1);
  };

  // Serialize to string
  // --------
  //

  this.toString = function() {
    return this.match[0];
  };
};

Match.prototype = new Match.Prototype();

// Substance.RegExp
// ================
//

var RegExp = function(exp) {
  this.exp = exp;
};

RegExp.Prototype = function() {

  this.match = function(str) {
    if (str === undefined) throw new Error('No string given');
    
    if (!this.exp.global) {
      return this.exp.exec(str);
    } else {
      var matches = [];
      var match;
      // Reset the state of the expression
      this.exp.compile(this.exp);

      // Execute until last match has been found

      while ((match = this.exp.exec(str)) !== null) {
        matches.push(new Match(match));
      }
      return matches;
    }
  };
};

RegExp.prototype = new RegExp.Prototype();

RegExp.Match = Match;


// Export
// ========

module.exports = RegExp;

},{}],127:[function(require,module,exports){
"use strict";

var util = require("./src/util");

util.async = require("./src/async");
util.errors = require("./src/errors");
util.html = require("./src/html");
util.dom = require("./src/dom");
util.Fragmenter = require("./src/fragmenter");

module.exports = util;

},{"./src/async":128,"./src/dom":129,"./src/errors":130,"./src/fragmenter":131,"./src/html":132,"./src/util":133}],128:[function(require,module,exports){
"use strict";

var _ = require("underscore");
var util = require("./util.js");

// Helpers for Asynchronous Control Flow
// --------

var async = {};

function callAsynchronousChain(options, cb) {
  var _finally = options["finally"] || function(err, data) { cb(err, data); };
  _finally = _.once(_finally);
  var data = options.data || {};
  var functions = options.functions;

  if (!_.isFunction(cb)) {
    return cb("Illegal arguments: a callback function must be provided");
  }

  var index = 0;
  var stopOnError = (options.stopOnError===undefined) ? true : options.stopOnError;
  var errors = [];

  function process(data) {
    var func = functions[index];

    // stop if no function is left
    if (!func) {
      if (errors.length > 0) {
        return _finally(new Error("Multiple errors occurred.", data));
      } else {
        return _finally(null, data);
      }
    }

    // A function that is used as call back for each function
    // which does the progression in the chain via recursion.
    // On errors the given callback will be called and recursion is stopped.
    var recursiveCallback = _.once(function(err, data) {
      // stop on error
      if (err) {
        if (stopOnError) {
          return _finally(err, null);
        } else {
          errors.push(err);
        }
      }

      index += 1;
      process(data);
    });

    // catch exceptions and propagat
    try {
      if (func.length === 0) {
        func();
        recursiveCallback(null, data);
      }
      else if (func.length === 1) {
        func(recursiveCallback);
      }
      else {
        func(data, recursiveCallback);
      }
    } catch (err) {
      console.log("util.async caught error:", err);
      util.printStackTrace(err);
      _finally(err);
    }
  }

  // start processing
  process(data);
}

// Calls a given list of asynchronous functions sequentially
// -------------------
// options:
//    functions:  an array of functions of the form f(data,cb)
//    data:       data provided to the first function; optional
//    finally:    a function that will always be called at the end, also on errors; optional

async.sequential = function(options, cb) {
  // allow to call this with an array of functions instead of options
  if(_.isArray(options)) {
    options = { functions: options };
  }
  callAsynchronousChain(options, cb);
};

function asynchronousIterator(options) {
  return function(data, cb) {
    // retrieve items via selector if a selector function is given
    var items = options.selector ? options.selector(data) : options.items;
    var _finally = options["finally"] || function(err, data) { cb(err, data); };
    _finally = _.once(_finally);

    // don't do nothing if no items are given
    if (!items) {
      return _finally(null, data);
    }

    var isArray = _.isArray(items);

    if (options.before) {
      options.before(data);
    }

    var funcs = [];
    var iterator = options.iterator;

    // TODO: discuss convention for iterator function signatures.
    // trying to achieve a combination of underscore and node.js callback style
    function arrayFunction(item, index) {
      return function(data, cb) {
        if (iterator.length === 2) {
          iterator(item, cb);
        } else if (iterator.length === 3) {
          iterator(item, index, cb);
        } else {
          iterator(item, index, data, cb);
        }
      };
    }

    function objectFunction(value, key) {
      return function(data, cb) {
        if (iterator.length === 2) {
          iterator(value, cb);
        } else if (iterator.length === 3) {
          iterator(value, key, cb);
        } else {
          iterator(value, key, data, cb);
        }
      };
    }

    if (isArray) {
      for (var idx = 0; idx < items.length; idx++) {
        funcs.push(arrayFunction(items[idx], idx));
      }
    } else {
      for (var key in items) {
        funcs.push(objectFunction(items[key], key));
      }
    }

    //console.log("Iterator:", iterator, "Funcs:", funcs);
    var chainOptions = {
      functions: funcs,
      data: data,
      finally: _finally,
      stopOnError: options.stopOnError
    };
    callAsynchronousChain(chainOptions, cb);
  };
}

// Creates an each-iterator for util.async chains
// -----------
//
//     var func = util.async.each(items, function(item, [idx, [data,]] cb) { ... });
//     var func = util.async.each(options)
//
// options:
//    items:    the items to be iterated
//    selector: used to select items dynamically from the data provided by the previous function in the chain
//    before:   an extra function called before iteration
//    iterator: the iterator function (item, [idx, [data,]] cb)
//       with item: the iterated item,
//            data: the propagated data (optional)
//            cb:   the callback

// TODO: support only one version and add another function
async.iterator = function(options_or_items, iterator) {
  var options;
  if (arguments.length == 1) {
    options = options_or_items;
  } else {
    options = {
      items: options_or_items,
      iterator: iterator
    };
  }
  return asynchronousIterator(options);
};

async.each = function(options, cb) {
  // create the iterator and call instantly
  var f = asynchronousIterator(options);
  f(null, cb);
};

module.exports = async;

},{"./util.js":133,"underscore":134}],129:[function(require,module,exports){
"use strict";

var _ = require("underscore");

// Helpers for working with the DOM

var dom = {};

dom.ChildNodeIterator = function(arg) {
  if(_.isArray(arg)) {
    this.nodes = arg;
  } else {
    this.nodes = arg.childNodes;
  }
  this.length = this.nodes.length;
  this.pos = -1;
};

dom.ChildNodeIterator.prototype = {
  hasNext: function() {
    return this.pos < this.length - 1;
  },

  next: function() {
    this.pos += 1;
    return this.nodes[this.pos];
  },

  back: function() {
    if (this.pos >= 0) {
      this.pos -= 1;
    }
    return this;
  }
};

// Note: it is not safe regarding browser in-compatibilities
// to access el.children directly.
dom.getChildren = function(el) {
  if (el.children !== undefined) return el.children;
  var children = [];
  var child = el.firstElementChild;
  while (child) {
    children.push(child);
    child = child.nextElementSibling;
  }
  return children;
};

dom.getNodeType = function(el) {
  if (el.nodeType === Node.TEXT_NODE) {
    return "text";
  } else if (el.nodeType === Node.COMMENT_NODE) {
    return "comment";
  } else if (el.tagName) {
    return el.tagName.toLowerCase();
  } else {
    throw new Error("Unknown node type");
  }
};

module.exports = dom;

},{"underscore":134}],130:[function(require,module,exports){
"use strict";

var util = require('./util');

var errors = {};

// The base class for Substance Errors
// -------
// We have been not so happy with the native error as it is really poor with respect to
// stack information and presentation.
// This implementation has a more usable stack trace which is rendered using `err.printStacktrace()`.
// Moreover, it provides error codes and error chaining.
var SubstanceError = function(message, rootError) {

  // If a root error is given try to take over as much information as possible
  if (rootError) {
    Error.call(this, message, rootError.fileName, rootError.lineNumber);

    if (rootError instanceof SubstanceError) {
      this.__stack = rootError.__stack;
    } else if (rootError.stack) {
      this.__stack = util.parseStackTrace(rootError);
    } else {
      this.__stack = util.callstack(1);
    }

  }

  // otherwise create a new stacktrace
  else {
    Error.call(this, message);
    this.__stack = util.callstack(1);
  }

  this.message = message;
};

SubstanceError.Prototype = function() {

  this.name = "SubstanceError";
  this.code = -1;

  this.toString = function() {
    return this.name+":"+this.message;
  };

  this.toJSON = function() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      stack: this.stack
    };
  };

  this.printStackTrace = function() {
    util.printStackTrace(this);
  };
};

SubstanceError.Prototype.prototype = Error.prototype;
SubstanceError.prototype = new SubstanceError.Prototype();

Object.defineProperty(SubstanceError.prototype, "stack", {
  get: function() {
    var str = [];
    for (var idx = 0; idx < this.__stack.length; idx++) {
      var s = this.__stack[idx];
      str.push(s.file+":"+s.line+":"+s.col+" ("+s.func+")");
    }
    return str.join("\n");
  },
  set: function() { throw new Error("SubstanceError.stack is read-only."); }
});

errors.SubstanceError = SubstanceError;


var createSubstanceErrorSubclass = function(parent, name, code) {
  return function(message) {
    parent.call(this, message);
    this.name = name;
    this.code = code;
  };
};

errors.define = function(className, code, parent) {
  if (!className) throw new SubstanceError("Name is required.");
  if (code === undefined) code = -1;

  parent = parent || SubstanceError;
  var ErrorClass = createSubstanceErrorSubclass(parent, className, code);
  var ErrorClassPrototype = function() {};
  ErrorClassPrototype.prototype = parent.prototype;
  ErrorClass.prototype = new ErrorClassPrototype();
  ErrorClass.prototype.constructor = ErrorClass;

  errors[className] = ErrorClass;
  return ErrorClass;
};

module.exports = errors;

},{"./util":133}],131:[function(require,module,exports){
"use strict";

var _ = require("underscore");

var ENTER = 1;
var EXIT = -1;

// Fragmenter
// --------
//
// An algorithm that is used to fragment overlapping structure elements
// following a priority rule set.
// E.g., we use this for creating DOM elements for annotations. The annotations
// can partially be overlapping. However this is not allowed in general for DOM elements
// or other hierarchical structures.
//
// Example: For the Annotation use casec consider a 'comment' spanning partially
// over an 'emphasis' annotation.
// 'The <comment>quick brown <bold>fox</comment> jumps over</bold> the lazy dog.'
// We want to be able to create a valid XML structure:
// 'The <comment>quick brown <bold>fox</bold></comment><bold> jumps over</bold> the lazy dog.'
//
// For that one would choose
//
//     {
//        'comment': 0,
//        'bold': 1
//     }
//
// as priority levels.
// In case of structural violations as in the example, elements with a higher level
// would be fragmented and those with lower levels would be preserved as one piece.
//
// TODO: If a violation for nodes of the same level occurs an Error should be thrown.
// Currently, in such cases the first element that is opened earlier is preserved.

var Fragmenter = function(levels) {
  if (!levels) {
    throw new Error("Requires a specification of element levels.");
  }
  this.levels = levels;
};

Fragmenter.Prototype = function() {

  // This is a sweep algorithm wich uses a set of ENTER/EXIT entries
  // to manage a stack of active elements.
  // Whenever a new element is entered it will be appended to its parent element.
  // The stack is ordered by the annotation types.
  //
  // Examples:
  //
  // - simple case:
  //
  //       [top] -> ENTER(idea1) -> [top, idea1]
  //
  //   Creates a new 'idea' element and appends it to 'top'
  //
  // - stacked ENTER:
  //
  //       [top, idea1] -> ENTER(bold1) -> [top, idea1, bold1]
  //
  //   Creates a new 'bold' element and appends it to 'idea1'
  //
  // - simple EXIT:
  //
  //       [top, idea1] -> EXIT(idea1) -> [top]
  //
  //   Removes 'idea1' from stack.
  //
  // - reordering ENTER:
  //
  //       [top, bold1] -> ENTER(idea1) -> [top, idea1, bold1]
  //
  //   Inserts 'idea1' at 2nd position, creates a new 'bold1', and appends itself to 'top'
  //
  // - reordering EXIT
  //
  //       [top, idea1, bold1] -> EXIT(idea1)) -> [top, bold1]
  //
  //   Removes 'idea1' from stack and creates a new 'bold1'
  //

  // Orders sweep events according to following precedences:
  //
  // 1. pos
  // 2. EXIT < ENTER
  // 3. if both ENTER: ascending level
  // 4. if both EXIT: descending level

  var _compare = function(a, b) {
    if (a.pos < b.pos) return -1;
    if (a.pos > b.pos) return 1;

    if (a.mode < b.mode) return -1;
    if (a.mode > b.mode) return 1;

    if (a.mode === ENTER) {
      if (a.level < b.level) return -1;
      if (a.level > b.level) return 1;
    }

    if (a.mode === EXIT) {
      if (a.level > b.level) return -1;
      if (a.level < b.level) return 1;
    }

    return 0;
  };

  var extractEntries = function(annotations) {
    var entries = [];
    _.each(annotations, function(a) {
      var l = this.levels[a.type];

      // ignore annotations that are not registered
      if (l === undefined) {
        return;
      }

      entries.push({ pos : a.range[0], mode: ENTER, level: l, id: a.id, type: a.type });
      entries.push({ pos : a.range[1], mode: EXIT, level: l, id: a.id, type: a.type });
    }, this);
    return entries;
  };

  this.onText = function(/*context, text*/) {};

  // should return the created user context
  this.onEnter = function(/*entry, parentContext*/) {
    return null;
  };
  this.onExit = function(/*entry, parentContext*/) {};

  this.enter = function(entry, parentContext) {
    return this.onEnter(entry, parentContext);
  };

  this.exit = function(entry, parentContext) {
    this.onExit(entry, parentContext);
  };

  this.createText = function(context, text) {
    this.onText(context, text);
  };

  this.start = function(rootContext, text, annotations) {
    var entries = extractEntries.call(this, annotations);
    entries.sort(_compare.bind(this));

    var stack = [{context: rootContext, entry: null}];

    var pos = 0;

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];

      // in any case we add the last text to the current element
      this.createText(stack[stack.length-1].context, text.substring(pos, entry.pos));

      pos = entry.pos;
      var level = 1;

      var idx;

      if (entry.mode === ENTER) {
        // find the correct position and insert an entry
        for (; level < stack.length; level++) {
          if (entry.level < stack[level].entry.level) {
            break;
          }
        }
        stack.splice(level, 0, {entry: entry});
      }
      else if (entry.mode === EXIT) {
        // find the according entry and remove it from the stack
        for (; level < stack.length; level++) {
          if (stack[level].entry.id === entry.id) {
            break;
          }
        }
        for (idx = level; idx < stack.length; idx++) {
          this.exit(stack[idx].entry, stack[idx-1].context);
        }
        stack.splice(level, 1);
      }

      // create new elements for all lower entries
      for (idx = level; idx < stack.length; idx++) {
        stack[idx].context = this.enter(stack[idx].entry, stack[idx-1].context);
      }
    }

    // Finally append a trailing text node
    this.createText(rootContext, text.substring(pos));
  };

};
Fragmenter.prototype = new Fragmenter.Prototype();

module.exports = Fragmenter;

},{"underscore":134}],132:[function(require,module,exports){
"use strict";

var html = {};
var _ = require("underscore");

html.templates = {};

// html.compileTemplate = function(tplName) {
//   var rawTemplate = $('script[name='+tplName+']').html();
//   html.templates[tplName] = Handlebars.compile(rawTemplate);
// };

html.renderTemplate = function(tplName, data) {
  return html.templates[tplName](data);
};

// Handlebars.registerHelper('ifelse', function(cond, textIf, textElse) {
//   textIf = Handlebars.Utils.escapeExpression(textIf);
//   textElse  = Handlebars.Utils.escapeExpression(textElse);
//   return new Handlebars.SafeString(cond ? textIf : textElse);
// });

if (typeof window !== "undefined") {
  // A fake console to calm down some browsers.
  if (!window.console) {
    window.console = {
      log: function(msg) {
        // No-op
      }
    };
  }
}

// Render Underscore templates
html.tpl = function (tpl, ctx) {
  ctx = ctx || {};
  var source = $('script[name='+tpl+']').html();
  return _.template(source, ctx);
};

// Exports
// ====

module.exports = html;

},{"underscore":134}],133:[function(require,module,exports){
"use strict";

// Imports
// ====

var _ = require('underscore');

// Module
// ====

var util = {};

// UUID Generator
// -----------------

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

util.uuid = function (prefix, len) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split(''),
      uuid = [],
      radix = 16,
      idx;
  len = len || 32;

  if (len) {
    // Compact form
    for (idx = 0; idx < len; idx++) uuid[idx] = chars[0 | Math.random()*radix];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (idx = 0; idx < 36; idx++) {
      if (!uuid[idx]) {
        r = 0 | Math.random()*16;
        uuid[idx] = chars[(idx == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return (prefix ? prefix : "") + uuid.join('');
};

// creates a uuid function that generates counting uuids
util.uuidGen = function(defaultPrefix) {
  var id = 1;
  defaultPrefix = (defaultPrefix !== undefined) ? defaultPrefix : "uuid_";
  return function(prefix) {
    prefix = prefix || defaultPrefix;
    return prefix+(id++);
  };
};


// Events
// ---------------

// Taken from Backbone.js
//
// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, util.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
var triggerEvents = function(events, args) {
  var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
  switch (args.length) {
    case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
    case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
    case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
    case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
    default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
  }
};

// Regular expression used to split event strings.
var eventSplitter = /\s+/;

// Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.
var eventsApi = function(obj, action, name, rest) {
  if (!name) return true;

  // Handle event maps.
  if (typeof name === 'object') {
    for (var key in name) {
      obj[action].apply(obj, [key, name[key]].concat(rest));
    }
    return false;
  }

  // Handle space separated event names.
  if (eventSplitter.test(name)) {
    var names = name.split(eventSplitter);
    for (var i = 0, l = names.length; i < l; i++) {
      obj[action].apply(obj, [names[i]].concat(rest));
    }
    return false;
  }

  return true;
};

util.Events = {

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on: function(name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
    this._events =  this._events || {};
    var events = this._events[name] || (this._events[name] = []);
    events.push({callback: callback, context: context, ctx: context || this});
    return this;
  },

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, it will be removed.
  once: function(name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
    var self = this;
    var once = _.once(function() {
      self.off(name, once);
      callback.apply(this, arguments);
    });
    once._callback = callback;
    return this.on(name, once, context);
  },

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off: function(name, callback, context) {
    var retain, ev, events, names, i, l, j, k;
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
    if (!name && !callback && !context) {
      this._events = {};
      return this;
    }

    names = name ? [name] : _.keys(this._events);
    for (i = 0, l = names.length; i < l; i++) {
      name = names[i];
      events = this._events[name];
      if (events) {
        this._events[name] = retain = [];
        if (callback || context) {
          for (j = 0, k = events.length; j < k; j++) {
            ev = events[j];
            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                (context && context !== ev.context)) {
              retain.push(ev);
            }
          }
        }
        if (!retain.length) delete this._events[name];
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function(name) {
    if (!this._events) return this;
    var args = Array.prototype.slice.call(arguments, 1);
    if (!eventsApi(this, 'trigger', name, args)) return this;
    var events = this._events[name];
    var allEvents = this._events.all;
    if (events) triggerEvents(events, args);
    if (allEvents) triggerEvents(allEvents, arguments);
    return this;
  },

  triggerLater: function() {
    var self = this;
    var _arguments = arguments;
    setTimeout(function() {
      self.trigger.apply(self, _arguments);
    }, 0);
  },

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening: function(obj, name, callback) {
    var listeners = this._listeners;
    if (!listeners) return this;
    var deleteListener = !name && !callback;
    if (typeof name === 'object') callback = this;
    if (obj) (listeners = {})[obj._listenerId] = obj;
    for (var id in listeners) {
      listeners[id].off(name, callback, this);
      if (deleteListener) delete this._listeners[id];
    }
    return this;
  }

};

var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

// Inversion-of-control versions of `on` and `once`. Tell *this* object to
// listen to an event in another object ... keeping track of what it's
// listening to.
_.each(listenMethods, function(implementation, method) {
  util.Events[method] = function(obj, name, callback) {
    var listeners = this._listeners || (this._listeners = {});
    var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
    listeners[id] = obj;
    if (typeof name === 'object') callback = this;
    obj[implementation](name, callback, this);
    return this;
  };
});

// Aliases for backwards compatibility.
util.Events.bind   = util.Events.on;
util.Events.unbind = util.Events.off;

util.Events.Listener = {

  listenTo: function(obj, name, callback) {
    if (!_.isFunction(callback)) {
      throw new Error("Illegal argument: expecting function as callback, was: " + callback);
    }

    // initialize container for keeping handlers to unbind later
    this._handlers = this._handlers || [];

    obj.on(name, callback, this);

    this._handlers.push({
      unbind: function() {
        obj.off(name, callback);
      }
    });

    return this;
  },

  stopListening: function() {
    if (this._handlers) {
      for (var i = 0; i < this._handlers.length; i++) {
        this._handlers[i].unbind();
      }
    }
  }

};

util.propagate = function(data, cb) {
  if(!_.isFunction(cb)) {
    throw "Illegal argument: provided callback is not a function";
  }
  return function(err) {
    if (err) return cb(err);
    cb(null, data);
  };
};

// shamelessly stolen from backbone.js:
// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
var ctor = function(){};
util.inherits = function(parent, protoProps, staticProps) {
  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent's constructor.
  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ parent.apply(this, arguments); };
  }

  // Inherit class (static) properties from parent.
  _.extend(child, parent);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function.
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();

  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) _.extend(child.prototype, protoProps);

  // Add static properties to the constructor function, if supplied.
  if (staticProps) _.extend(child, staticProps);

  // Correctly set child's `prototype.constructor`.
  child.prototype.constructor = child;

  // Set a convenience property in case the parent's prototype is needed later.
  child.__super__ = parent.prototype;

  return child;
};

// Util to read seed data from file system
// ----------

util.getJSON = function(resource, cb) {
  if (typeof exports !== 'undefined') {
    var fs = require('fs');
    var obj = JSON.parse(fs.readFileSync(resource, 'utf8'));
    cb(null, obj);
  } else {
    //console.log("util.getJSON", resource);
    $.getJSON(resource)
      .done(function(obj) { cb(null, obj); })
      .error(function(err) { cb(err, null); });
  }
};

util.prototype = function(that) {
  /*jshint proto: true*/ // supressing a warning about using deprecated __proto__.
  return Object.getPrototypeOf ? Object.getPrototypeOf(that) : that.__proto__;
};

util.inherit = function(Super, Self) {
  var super_proto = _.isFunction(Super) ? new Super() : Super;
  var proto;
  if (_.isFunction(Self)) {
    Self.prototype = super_proto;
    proto = new Self();
  } else {
    var TmpClass = function(){};
    TmpClass.prototype = super_proto;
    proto = _.extend(new TmpClass(), Self);
  }
  return proto;
};

util.pimpl = function(pimpl) {
  var Pimpl = function(self) {
    this.self = self;
  };
  Pimpl.prototype = pimpl;
  return function(self) { self = self || this; return new Pimpl(self); };
};

util.parseStackTrace = function(err) {
  var SAFARI_STACK_ELEM = /([^@]*)@(.*):(\d+)/;
  var CHROME_STACK_ELEM = /\s*at ([^(]*)[(](.*):(\d+):(\d+)[)]/;

  var idx;
  var stackTrace = err.stack.split('\n');

  // parse the stack trace: each line is a tuple (function, file, lineNumber)
  // Note: unfortunately this is interpreter specific
  // safari: "<function>@<file>:<lineNumber>"
  // chrome: "at <function>(<file>:<line>:<col>"

  var stack = [];
  for (idx = 0; idx < stackTrace.length; idx++) {
    var match = SAFARI_STACK_ELEM.exec(stackTrace[idx]);
    if (!match) match = CHROME_STACK_ELEM.exec(stackTrace[idx]);
    if (match) {
      var entry = {
        func: match[1],
        file: match[2],
        line: match[3],
        col: match[4] || 0
      };
      if (entry.func === "") entry.func = "<anonymous>";
      stack.push(entry);
    }
  }

  return stack;
};

util.callstack = function(k) {
  var err;
  try { throw new Error(); } catch (_err) { err = _err; }
  var stack = util.parseStackTrace(err);
  k = k || 0;
  return stack.splice(k+1);
};

util.stacktrace = function (err) {
  var stack = (arguments.length === 0) ? util.callstack().splice(1) : util.parseStackTrace(err);
  var str = [];
  _.each(stack, function(s) {
    str.push(s.file+":"+s.line+":"+s.col+" ("+s.func+")");
  });
  return str.join("\n");
};

util.printStackTrace = function(err, N) {
  if (!err.stack) return;

  var stack;

  // Substance errors have a nice stack already
  if (err.__stack !== undefined) {
    stack = err.__stack;
  }
  // built-in errors have the stack trace as one string
  else if (_.isString(err.stack)) {
    stack = util.parseStackTrace(err);
  }
  else return;

  N = N || stack.length;
  N = Math.min(N, stack.length);

  for (var idx = 0; idx < N; idx++) {
    var s = stack[idx];
    console.log(s.file+":"+s.line+":"+s.col, "("+s.func+")");
  }
};

// computes the difference of obj1 to obj2
util.diff = function(obj1, obj2) {
  var diff;
  if (_.isArray(obj1) && _.isArray(obj2)) {
    diff = _.difference(obj2, obj1);
    // return null in case of equality
    if (diff.length === 0) return null;
    else return diff;
  }
  if (_.isObject(obj1) && _.isObject(obj2)) {
    diff = {};
    _.each(Object.keys(obj2), function(key) {
      var d = util.diff(obj1[key], obj2[key]);
      if (d) diff[key] = d;
    });
    // return null in case of equality
    if (_.isEmpty(diff)) return null;
    else return diff;
  }
  if(obj1 !== obj2) return obj2;
};

// Deep-Clone a given object
// --------
// Note: this is currently done via JSON.parse(JSON.stringify(obj))
//       which is in fact not optimal, as it depends on `toJSON` implementation.
util.deepclone = function(obj) {
  if (obj === undefined) return undefined;
  if (obj === null) return null;
  return JSON.parse(JSON.stringify(obj));
};

// Clones a given object
// --------
// Calls obj's `clone` function if available,
// otherwise clones the obj using `util.deepclone()`.
util.clone = function(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (_.isFunction(obj.clone)) {
    return obj.clone();
  }
  return util.deepclone(obj);
};

util.freeze = function(obj) {
  var idx;
  if (_.isObject(obj)) {
    if (Object.isFrozen(obj)) return obj;

    var keys = Object.keys(obj);
    for (idx = 0; idx < keys.length; idx++) {
      var key = keys[idx];
      obj[key] = util.freeze(obj[key]);
    }
    return Object.freeze(obj);
  } else if (_.isArray(obj)) {
    var arr = obj;
    for (idx = 0; idx < arr.length; idx++) {
      arr[idx] = util.freeze(arr[idx]);
    }
    return Object.freeze(arr);
  } else {
    return obj; // Object.freeze(obj);
  }
};

util.later = function(f, context) {
  return function() {
    var _args = arguments;
    setTimeout(function() {
      f.apply(context, _args);
    }, 0);
  };
};


// Returns true if a string doesn't contain any real content

util.isEmpty = function(str) {
  return !str.match(/\w/);
};

// Create a human readable, but URL-compatible slug from a string

util.slug = function(str) {
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

// Export
// ====

module.exports = util;

},{"fs":135,"underscore":134}],134:[function(require,module,exports){
//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}],135:[function(require,module,exports){

},{}]},{},[7])