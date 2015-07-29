'use strict';

var OO = require('../basics/oo');
var _ = require('../basics/helpers');

var __id__ = 0;

/**
 * A light-weight component implementation inspired by React and Ember.
 * In contrast to the large frameworks it does much less things automagically
 * in favour of a simple and synchronous life-cyle.
 *
 * Features:
 * - light-weight but simplified rerendering
 * - minimalistic life-cycle with hooks
 * - up-tree communication (sendAction)
 * - dependency injection
 */
function Component(parent, props) {
  if (!parent && parent !== "root") {
    throw new Error("Contract: every component needs to have a parent.");
  }
  this.__id__ = __id__++;

  this.parent = parent;
  this.children = [];
  this._childrenById = {};
  this.refs = {};

  this._setProps(props);
  this._setState(this.getInitialState());
  this.$el = this.createElement();
  // gather context from parent components (dependency injection)
  this.context = this._collectContext();

  this._virgin = true;
}

Component.Prototype = function ComponentPrototype() {

  this.tagName = 'div';

  this.getInitialState = function() {
    return {};
  };

  this.getContext = function() {
    return {};
  };

  this.createElement = function() {
    var $el = $('<' + this.tagName + '>');
    $el.addClass(this.classNames);
    if (this.props.classNames) {
      $el.addClass(this.props.classNames);
    }
    _.each(this.props, function(val, key) {
      if (key.slice(0, 5) === "data-") {
        $el.attr(key, val);
      }
    });
    return $el;
  };

  /**
   * Creates a virtual description of the content.
   * See `Component.$$`.
   */
  this.render = function() {};

  this.shouldRerender = function(newProps, newState) {
    /* jshint unused: false */
    return !_.isEqual(newProps, this.props) || !_.isEqual(newState, this.state);
  };

  this.rerender = function() {
    var oldChildren = this._childrenById;
    var content = this.compileContent(this.render());
    this._renderContent(content);
    // automatical unmounting unused children
    _.each(oldChildren, function(child, key) {
      if (!this._childrenById[key]) {
        console.log('Automatically unmounting', child);
        child.unmount();
      }
    }, this);
    return this;
  };

  /**
   * Renders and appends this component to a given element.
   *
   * If the element is in the DOM already, triggers `component.didMount()`
   * on this component and all of its children.
   */
  this.mount = function($el) {
    var content = this.compileContent(this.render());
    this._renderContent(content);
    $el.append(this.$el);
    // trigger didMount automatically if the given element is already in the DOM
    if (_isInDocument($el[0])) {
      this.triggerDidMount();
    }
    return this;
  };

  /**
   * Triggers didMount handlers recursively.
   *
   * Gets called when using `component.mount(el)` on an element being
   * in the DOM already. Typically this is done for a root component.
   *
   * If this is not possible because you want to do things differently, make sure
   * you call 'component.triggerDidMount()' on root components.
   *
   * @example
   * ```
   * var frag = document.createDocumentFragment();
   * var component = new MyComponent();
   * component.mount(frag);
   * ...
   * $('body').append(frag);
   * component.triggerDidMount();
   * ```
   */
  this.triggerDidMount = function() {
    this.didMount();
    _.each(this.children, function(child) {
      child.triggerDidMount();
    });
  };

  /**
   * Called when the element is inserted into the DOM.
   *
   * Node: make sure that you call `component.mount(el)` using an element
   * which is already in the DOM.
   *
   * @example
   * ```
   * var component = new MyComponent();
   * component.mount($('body')[0])
   * ```
   */
  this.didMount = function() {};

  /**
   * Removes
   */
  this.unmount = function() {
    this.triggerWillUnmount();
    this.$el.remove();
    return this;
  };

  this.triggerWillUnmount = function() {
    _.each(this.children, function(child) {
      child.triggerWillUnmount();
    });
    this.willUnmount();
  };

  this.willUnmount = function() {
    console.log('Will unmount', this);
  };

  this.getParent = function() {
    return this.parent;
  };

  this.send = function(action) {
    var comp = this;
    while(comp) {
      if (comp[action]) {
        return comp[action].apply(comp, Array.prototype.slice.call(arguments, 1));
      }
      comp = comp.getParent();
    }
    throw new Error('No component handled action: ' + action);
  };

  this.setState = function(newState) {
    var needRerender = this.shouldRerender(this.getProps(), newState);
    this._setState(newState);
    if (needRerender) {
      this.rerender();
    }
  };

  this.setProps = function(newProps) {
    var needRerender = this.shouldRerender(newProps, this.getState());
    this.willUpdateProps(newProps);
    this._setProps(newProps);
    if (needRerender) {
      this.rerender();
    }
  };

  this.getProps = function() {
    return this.props;
  };

  this.willUpdateProps = function(newProps) {
    /* jshint unused:false */
  };

  var _isDocumentElement = function(el) {
    // Node.DOCUMENT_NODE = 9
    return (el.nodeType === 9);
  };

  var _isElement = function(el) {
    // Node.ELEMENT_NODE = 1
    return (el.nodeType === 1);
  };

  var _isInDocument = function(el) {
    while(el) {
      if (_isDocumentElement(el)) {
        return true;
      }
      el = el.parentNode;
    }
    return false;
  };

  this.compileContent = function(contentData) {
    if (!_.isArray(contentData)) {
      contentData = [contentData];
    }
    var content = [];
    _.each(contentData, function(data) {
      var child = null;
      var childContent = null;
      if (_.isString(data)) {
        content.push(data);
      } else if (data.type === 'element') {
        child = new Component.HtmlElement(data.tagName, this, data.props);
        childContent = child.compileContent(data.children);
        child._renderContent(childContent);
      } else if (data.type === 'class') {
        child = new data.ComponentClass(this, data.props);
        childContent = child.compileContent(child.render());
        child._renderContent(childContent);
      } else if (data.type === 'component') {
        child = data.component;
        if (child.parent !== this) {
          throw new Error('Child has not been created for this component.');
        }
        // render the component if it has never been rendered before
        if (child._virgin) {
          childContent = child.compileContent(child.render());
          child._renderContent(childContent);
        }
      }
      if (child) {
        content.push(child);
      }
    }, this);
    return content;
  };

  this._renderContent = function(content) {
    var $el = this.$el;
    this.children = [];
    this._childrenById = {};
    this.refs = {};
    _.each(content, function(child) {
      if (_.isString(child)) {
        $el.append(child);
      } else {
        this.children.push(child);
        this._childrenById[child.__id__] = child;
        if (child.props.ref) {
          this.refs[child.props.ref] = child;
        }
        $el.append(child.$el);
      }
    }, this);
    delete this._virgin;
  };

  this._collectActionHandlers = function() {
    var args = [];
    var ctor = this.constructor;
    var proto = ctor.prototype;
    while(proto) {
      if (proto.actions) {
        args.unshift(proto.actions);
      }
      proto = proto.prototype;
    }
    args.push({});
    return _.extend.apply(null, args);
  };

  this._collectContext = function() {
    var args = [];
    var comp = this;
    while(comp && comp instanceof Component) {
      var context = comp.getContext();
      if (context) {
        args.unshift(context);
      }
      comp = comp.getParent();
    }
    args.push({});
    return _.extend.apply(null, args);
  };

  this._setProps = function(props) {
    this.props = props || {};
    // freezing properties to 'enforce' immutability
    Object.freeze(props);
  };

  this._setState = function(state) {
    this.state = state || {};
    // freezing state to 'enforce' immutability
    Object.freeze(state);
  };

};

OO.initClass(Component);

Component.Root = function(props) {
  Component.call(this, "root", props);
};
OO.inherit(Component.Root, Component);

Component.HtmlElement = function(tagName, parent, props) {
  this.tagName = tagName;
  Component.call(this, parent, props);
};
OO.inherit(Component.HtmlElement, Component);

Component.$$ = function() {
  var content = null;
  var props = arguments[1];
  var children = arguments[2];
  if (arguments.length > 3) {
    children = Array.prototype.slice.call(arguments, 2);
  }
  if (_.isString(arguments[0])) {
    // create a primitive component
    return {
      type: 'element',
      tagName: arguments[0],
      props: props,
      children: children
    };
  } else if (_.isFunction(arguments[0]) && arguments[0].prototype instanceof Component) {
    return {
      type: 'class',
      ComponentClass: arguments[0],
      props: props,
      children: children
    };
  } else if (arguments[0] instanceof Component) {
    return {
      type: 'component',
      component: arguments[0],
      props: props,
      children: children
    };
  }
  if (!content) {
    throw new Error('Illegal usage of Component.$$.');
  }
  return content;
};


module.exports = Component;
