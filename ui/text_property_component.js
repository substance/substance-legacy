"use strict";

var OO = require('../basics/oo');
var Component = require('./component');
var $$ = Component.$$;
var Annotator = require('../document/annotator');
var AnnotationComponent = require('./nodes/annotation_component');

function TextPropertyComponent() {
  Component.apply(this, arguments);
}

TextPropertyComponent.Prototype = function() {

  this.render = function() {
    var componentRegistry = this.context.componentRegistry;
    var doc = this.getDocument();
    var path = this.getPath();
    var text = doc.get(path) || "";
    var annotations = this.getAnnotations();

    var el = $$(this.props.tagName || 'span', {
      classNames: "text-property " + (this.props.classNames || ""),
      "data-path": this.props.path.join('.'),
      spellCheck: false,
      style: {
        whiteSpace: "pre-wrap"
      },
    });

    var annotator = new Annotator();
    var fragmentCounters = {};
    // for debugging
    // var _level = 0;
    // var _logIndent = function(level) {
    //   var prefix = "";
    //   for (var i = 0; i < level; i++) {
    //     prefix = prefix.concat("  ");
    //   }
    //   return prefix;
    // };
    // var _logPrefix = "";
    annotator.onText = function(context, text) {
      // console.log(_logPrefix+text);
      // HACK: this should not be necessary
      if (text && text.length > 0) {
        context.children.push(new Component.VirtualTextNode(text));
      }
    };
    annotator.onEnter = function(entry) {
      // for debugging
      // _logPrefix = _logIndent(++_level);
      var node = entry.node;
      var id = node.id;
      if (!fragmentCounters[id]) {
        fragmentCounters[id] = 0;
      }
      fragmentCounters[id] = fragmentCounters[id]+1;
      // for debugging
      // console.log(_logPrefix+"<"+node.type+" key="+key+">");

      // TODO: we need a component factory, so that we can create the appropriate component
      var ViewClass;
      if (componentRegistry.contains(node.type)) {
        ViewClass = componentRegistry.get(node.type);
      } else {
        ViewClass = AnnotationComponent;
      }

      var classNames = [];
      // special support for container annotation fragments
      if (node.type === "container_annotation_fragment") {
        // TODO: this seems a bit messy
        classNames = classNames.concat(node.anno.getTypeNames().join(' ').replace(/_/g, "-").split());
        classNames.push("annotation-fragment");
      } else if (node.type === "container-annotation-anchor") {
        classNames = classNames.concat(node.anno.getTypeNames().join(' ').replace(/_/g, "-").split());
        classNames.push("anchor");
        classNames.push(node.isStart?"start-anchor":"end-anchor");
      }
      return {
        ViewClass: ViewClass,
        props: {
          doc: doc,
          node: node,
          classNames: classNames.join(' '),
        },
        children: []
      };
    };
    annotator.onExit = function(entry, context, parentContext) {
      // for debugging
      // _logPrefix = _logIndent(_level--);
      // console.log(_logPrefix+"</"+entry.node.type+">");
      var args = [context.ViewClass, context.props].concat(context.children);
      var view = $$.apply(null, args);
      parentContext.children.push(view);
    };
    annotator.start(el, text, annotations);
    // NOTE: this is particularly necessary for text-properties of
    // block level text nodes. Otherwise, the element will not y-expand
    // as desired, and soft-breaks are not visible.
    // TODO: sometimes we do not want to do this. Make it configurable.
    el.append($$('br'));

    // HACK: need to post-process as some of the data has been
    // add using push and not processed via $$.
    Component.$$.prepareChildren(el.children);
    return el;
  };

  this.didMount = function() {
    var doc = this.props.doc;
    doc.getEventProxy('path').add(this.props.path, this, this.textPropertyDidChange);
  };

  this.willUnmount = function() {
    var doc = this.props.doc;
    doc.getEventProxy('path').remove(this.props.path, this);
  };

  this.getAnnotations = function() {
    return this.context.surface.getAnnotationsForProperty(this.props.path);
  };

  // Annotations that are active (not just visible)
  this.getHighlights = function() {
    if (this.context.getHighlightedNodes) {
      return this.context.getHighlightedNodes();
    } else {
      return [];
    }
  };

  this.textPropertyDidChange = function() {
    this.rerender();
  };

  this.getContainer = function() {
    return this.getSurface().getContainer();
  };

  this.getDocument = function() {
    return this.props.doc;
  };

  this.getPath = function() {
    return this.props.path;
  };

  this.getElement = function() {
    return this.$el[0];
  };

  this.getSurface = function() {
    return this.context.surface;
  };
};

OO.inherit(TextPropertyComponent, Component);

module.exports = TextPropertyComponent;
