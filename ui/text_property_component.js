"use strict";

var Substance = require('substance');
var _ = require('substance/helpers');
var Component = require('./component');
var $$ = Component.$$;
var Annotator = Substance.Document.Annotator;
var AnnotationComponent = require('./annotation_component');

var TextPropertyComponent extends Component {

  didMount: function() {
    var doc = this.props.doc;
    doc.getEventProxy('path').add(this.props.path, this, this.textPropertyDidChange);
  },

  willUnmount: function() {
    var doc = this.props.doc;
    doc.getEventProxy('path').remove(this.props.path, this);
  },

  render: function() {
    return $$((this.props.tagName || 'span'), {
      classNames: "text-property " + (this.props.className || ""),
      spellCheck: false,
      style: {
        whiteSpace: "pre-wrap"
      },
      "data-path": this.props.path.join('.')
    }, this.renderChildren());
  },

  renderChildren: function() {
    var componentRegistry = this.context.componentRegistry;
    var doc = this.getDocument();
    var path = this.getPath();
    var text = doc.get(path) || "";
    var annotations = this.getAnnotations();

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
      context.children.push(text);
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
      var key = id + "_" + fragmentCounters[id];
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
    var root = { children: [] };
    annotator.start(root, text, annotations);
    // NOTE: this is particularly necessary for text-properties of
    // block level text nodes. Otherwise, the element will not y-expand
    // as desired, and soft-breaks are not visible.
    // TODO: sometimes we do not want to do this. Make it configurable.
    root.children.push($$('br'));
    return root.children;
  },

  getAnnotations: function() {
    return this.context.surface.getAnnotationsForProperty(this.props.path);
  },

  // Annotations that are active (not just visible)
  getHighlights: function() {
    if (this.context.getHighlightedNodes) {
      return this.context.getHighlightedNodes();
    } else {
      return [];
    }
  },

  textPropertyDidChange: function() {
    this.rerender();
  },

  getContainer: function() {
    return this.getSurface().getContainer();
  },

  getDocument: function() {
    return this.props.doc;
  },

  getPath: function() {
    return this.props.path;
  },

  getElement: function() {
    return this.$el[0];
  },

  getSurface: function() {
    return this.context.surface;
  },

}));

module.exports = TextPropertyComponent;
