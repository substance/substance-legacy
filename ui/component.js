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

  if (props) {
    if (props.key) {
      this.keyId = props.key;
    }
    if (props.ref) {
      this.refId = props.ref;
    }
  }

  this.parent = parent;
  this.content = [];
  this.children = {};
  this.refs = {};

  this._setProps(props);
  this._setState(this.getInitialState());
  this.$el = this.createElement();
  this.setAttributes();

  // gather context from parent components (dependency injection)
  this.context = this._collectContext();
}

Component.Prototype = function ComponentPrototype() {

  this.tagName = 'div';

  this.getInitialState = function() {
    return {};
  };

  this.getContext = function() {
    return {};
  };

  this.getParent = function() {
    return this.parent;
  };

  this.createElement = function() {
    this.$el = $('<' + this.tagName + '>');
    this.$el.addClass(this.classNames);
    if (this.props.classNames) {
      this.$el.addClass(this.props.classNames);
    }
    return this.$el;
  };

  this.setAttributes = function() {
    _.each(this.props, function(val, key) {
      if (key.slice(0, 5) === "data-") {
        this.$el.attr(key, val);
      }
    }, this);
  };

  this.removeAttributes = function() {
    _.each(this.props, function(val, key) {
      if (key.slice(0, 5) === "data-") {
        this.$el.removeAttr(key, val);
      }
    }, this);
  };

  /**
   * Creates a virtual description of the content.
   * See `Component.$$`.
   */
  this.render = function() {
    return [];
  };

  this.shouldRerender = function(newProps, newState) {
    /* jshint unused: false */
    return !_.isEqual(newProps, this.props) || !_.isEqual(newState, this.state);
  };

  this.rerender = function() {
    this._renderContent(this.render());
  };

  /**
   * Renders and appends this component to a given element.
   *
   * If the element is in the DOM already, triggers `component.didMount()`
   * on this component and all of its children.
   */
  this.mount = function($el) {
    this._renderContent(this.render());
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
   * Removes this component from its parent.
   */
  this.unmount = function() {
    this.triggerWillUnmount();
    this.$el.remove();
    // TODO: do we need to remove this from parents children
    // right now it feels like that it doesn't make a great difference
    // because most often this method is called by the parent during rerendering
    // and on other cases it would be gone after the next parent rerender.
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

  this.getState = function() {
    return this.state;
  };


  this.setProps = function(newProps) {
    var needRerender = this.shouldRerender(newProps, this.getState());
    this._setProps(newProps);
    if (needRerender) {
      this.rerender();
    }
  };

  this.getProps = function() {
    return this.props;
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

  function _indexByKey(content, old) {
    var index = {};
    for (var i = 0; i < content.length; i++) {
      var key;
      // yuck
      if (old) {
        key = content[i].component.keyId;
      } else {
        key = content[i].props.key;
      }
      if (key) {
        index[key] = content[i];
      }
    }
    return index;
  }

  function _prepareContent(content) {
    if (!_.isArray(content)) {
      content = [ content ];
    }
    // preparations for text nodes
    for (var i = 0; i < content.length; i++) {
      if (_.isString(content[i])) {
        content[i] = {
          type: 'text',
          props: {},
          text: content[i]
        };
      }
    }
    return content;
  }

  this._renderContent = function(newContent) {
    // to allow more freedom in Component.render()
    // we do some normalization here
    newContent = _prepareContent(newContent);

    var el = this.$el[0];
    var isMounted = _isInDocument(el);
    var oldContent = this.content;
    var oldComps = _indexByKey(oldContent, "old");
    var newComps = _indexByKey(newContent);

    var pos = 0;
    var oldPos = 0;
    var newPos = 0;

    var children = {};
    var refs = {};

    function _removeOldData(key) {
      // remove the data so we do not process it again
      delete oldComps[key];
      for (var i = oldPos+1; i < oldContent.length; i++) {
        if (oldContent[i].component.keyId === key) {
          oldContent.splice(i, 1);
          break;
        }
      }
    }

    function _replace(oldComp, newComp) {
      oldComp.triggerWillUnmount();
      oldComp.$el.replaceWith(newComp.$el[0]);
    }

    function _update(comp, data) {
      if (comp instanceof Component.HtmlElement) {
        comp.setPropsAndChildren(data.props, data.children);
      } else {
        comp.setProps(data);
      }
    }

    function _registerComponent(comp) {
      children[comp.__id__] = comp;
      if (comp.keyId) {
        refs[comp.keyId] = comp;
      } else if (comp.refId) {
        refs[comp.refId] = comp;
      }
    }

    // step through old and new content data (~virtual DOM)
    // and apply changes to the component element
    while(oldPos < oldContent.length || newPos < newContent.length) {
      var node = el.childNodes[pos];
      var _old = oldContent[oldPos];
      var _new = newContent[newPos];
      var comp = null;

      // append remaining new components if there is no old one left
      if (!_old) {
        for (var i = newPos; i < newContent.length; i++) {
          comp = this._compileComponent(newContent[i]);
          if (isMounted) comp.triggerDidMount();
          this.$el.append(comp.$el);
          _registerComponent(comp);
        }
        break;
      }
      // unmount remaining old components if there is no old one left
      if (!_new) {
        for (var j = 0; j < oldContent.length; j++) {
          oldContent[j].component.unmount();
        }
        break;
      }

      // otherwise do a differential update
      if (node !== _old.component.$el[0]) {
        throw new Error('Assertion failed: DOM structure is not as expected.');
      }

      // Note: if the key property is set the component is treated preservatively
      var newKey = _new.props.key;
      var oldKey = _old.component.keyId;
      if (oldKey && newKey) {
        // the component is in the right place already
        if (oldKey === newKey) {
          comp = _old.component;
          _update(comp, _new);
          pos++; oldPos++; newPos++;
        }
        // a new component has been inserted
        else if (!oldComps[newKey] && newComps[oldKey]) {
          comp = this._compileComponent(_new);
          comp.$el.insertBefore(node);
          if (isMounted) comp.triggerDidMount();
          pos++; newPos++;
        }
        // old component has been replaced
        else if (!oldComps[newKey] && !newComps[oldKey]) {
          comp = this._compileComponent(_new);
          _replace(_old.component, comp);
          if (isMounted) comp.triggerDidMount();
          newPos++; oldPos++;
        }
        // component has been moved to a different position
        else if (oldComps[newKey]) {
          comp = oldComps[newKey].component;
          _update(comp, _new);
          // if the old component is coming up components have been swapped
          if (newComps[oldKey]) {
            comp.$el.insertBefore(node);
          }
          // otherwise we can replace the old one
          else {
            _replace(_old.component, comp);
            oldPos++;
          }
          pos++; newPos++;
          // remove the data so we do not process it again
          _removeOldData(newKey);
        }
        else {
          throw new Error('Assertion failed: should not reach this statement.');
        }
      } else if (newKey) {
        if (oldComps[newKey]) {
          _old.component.unmount();
          oldPos++;
          // continueing as we did not insert a component
          continue;
        }
        else {
          comp = this._compileComponent(_new);
          _replace(_old.component, comp);
          if (isMounted) comp.triggerDidMount();
          pos++; oldPos++; newPos++;
        }
      } else if (oldKey) {
        comp = this._compileComponent(_new);
        if (newComps[oldKey]) {
          comp.$el.insertBefore(node);
        } else {
          _replace(_old.component, comp);
          oldPos++;
        }
        if (isMounted) comp.triggerDidMount();
        pos++; newPos++;
      } else {
        // do not replace text components if they are equal
        if (_new.type === "text" && _old.type === "text" && _new.text === _old.text) {
          // skip
          pos++; oldPos++; newPos++;
          continue;
        }
        comp = this._compileComponent(_new);
        _replace(_old.component, comp);
        if (isMounted) comp.triggerDidMount();
        pos++; oldPos++; newPos++;
      }

      _registerComponent(comp);
    }

    this.children = children;
    this.refs = refs;
    this.content = newContent;
  };

  this._compileComponent = function(data) {
    var component;
    switch(data.type) {
      case 'text':
        component = new Component.Text(this, data.text);
        break;
      case 'element':
        component = new Component.HtmlElement(this, data.tagName, data.props);
        component._renderContent(data.children);
        break;
      case 'component':
        component = new data.ComponentClass(this, data.props);
        component._renderContent(component.render());
        break;
      default:
        throw new Error('Illegal state.');
    }
    data.component = component;
    return component;
  };

  this._collectContext = function() {
    var args = [];
    var comp = this;
    while(comp && comp instanceof Component) {
      var context = comp.childContext;
      if (context) {
        args.unshift(context);
      }
      comp = comp.getParent();
    }
    args.push({});
    return _.extend.apply(null, args);
  };


  var _builtinProps = ['key', 'ref'];

  this._setProps = function(props) {
    props = props || {};
    _.each(_builtinProps, function(key) {
      delete props[key];
    });
    // freezing properties to 'enforce' immutability
    Object.freeze(props);
    this.props = props;
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

Component.HtmlElement = function(parent, tagName, props) {
  this.tagName = tagName;
  Component.call(this, parent, props);
};
Component.HtmlElement.Prototype = function() {
  this.setPropsAndChildren = function(props, children) {
    if (children) {
      this._setProps(props);
      this._renderContent(children);
    } else {
      this.setProps(props);
    }
  };
  this.setProps = function(newProps) {
    // we do not need to rerender as new props can only be attributes
    this.removeAttributes();
    this._setProps(newProps);
    this.setAttributes();
  };
};
OO.inherit(Component.HtmlElement, Component);

Component.Text = function(parent, text) {
  Component.call(this, parent, {text: text});
};
Component.Text.Prototype = function() {
  this.createElement = function() {
    var el = document.createTextNode(this.props.text);
    return $(el);
  };
  this.setProps = function(props) {
    this._setProps(props);
    var $oldEl = this.$el;
    this.$el = this.createElement();
    $oldEl.replaceWith(this.$el[0]);
  };
};
OO.inherit(Component.Text, Component);

Component.$$ = function() {
  var content = null;
  var props = arguments[1];
  var children = arguments[2];
  if (arguments.length > 3) {
    children = Array.prototype.slice.call(arguments, 2);
  }
  if (_.isString(arguments[0])) {
    // create a primitive component
    content = {
      type: 'element',
      tagName: arguments[0]
    };
  } else if (_.isFunction(arguments[0]) && arguments[0].prototype instanceof Component) {
    content = {
      type: 'component',
      ComponentClass: arguments[0],
    };
  } else {
    throw new Error('Illegal usage of Component.$$.');
  }
  content.props = props || {};
  content.children = children || [];
  return content;
};

module.exports = Component;
