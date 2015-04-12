var Substance = require('substance');
var $$ = React.createElement;
var Annotator = Substance.Document.Annotator;
var ContainerAnnotation = Substance.Document.ContainerAnnotation;

var View = require('./view');
var NodeView = require('./node_view');
var AnnotationView = require('./annotation_view');
var AnnotationHandle = require('./annotation_handle');

// TextProperty
// ----------------
//

var TextProperty = React.createClass({
  displayName: "text-property",

  contextTypes: {
    surface: React.PropTypes.object.isRequired,
    getHighlightedNodes: React.PropTypes.func.isRequired,
    getHighlightsForTextProperty: React.PropTypes.func.isRequired,
  },

  getInitialState: function() {
    return { highlights: [] };
  },

  // Only necessary when
  shouldComponentUpdate: function() {
    this.renderManually();
    this.updateHighlights();
    return false;
  },

  componentDidMount: function() {
    var doc = this.props.doc;
    var surface = this.context.surface;
    doc.getEventProxy('path').add(this.props.path, this, this.textPropertyDidChange);

    // HACK: a guard so that we do not render manually when this is unmounted
    this.__mounted__ = true;

    // Note: even if we don't need to render in surfaces with container (~two-pass rendering)
    // we still need to render this in the context of fornm-editors.
    this.renderManually()
  },

  componentWillUnmount: function() {
    var doc = this.props.doc;
    var surface = this.context.surface;
    doc.getEventProxy('path').remove(this.props.path, this);
    this.__mounted__ = false;
  },

  renderManually: function() {
    // HACK: to achieve two-pass rendering for container backed surfaces
    // we store a state variable and skip 'deep' rendering here.
    if (this.context.surface.__prerendering__) return;
    // HACK: it happened that this is called even after this component had been mounted.
    // We need to track these situations and fix them in the right place.
    // However, we leave it here for a while to increase stability,
    // as these occasions are not critical for the overall functionality.
    if(!this.__mounted__) {
      console.warn('Tried to render an unmounted TextProperty');
      return;
    }
    var contentView = new TextProperty.ContentView({
      doc: this.props.doc,
      node: this.props.node,
      children: this.getContent()
    });
    var fragment = contentView.render();
    // Add a <br> so that the node gets rendered and Contenteditable will stop when moving the cursor.
    // TODO: probably this is not good when using the property inline.
    fragment.appendChild(document.createElement('br'));
    var domNode = this.getDOMNode();
    domNode.innerHTML = "";
    domNode.appendChild(fragment);
  },

  updateHighlights: function() {
    if (!this.context.getHighlightedNodes) return;
    var highlightedAnnotations = this.context.getHighlightedNodes();
    var domNode = this.getDOMNode();
    var els = $(domNode).find('.annotation');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var activate = highlightedAnnotations.indexOf(el.dataset.id) >= 0;
      if (activate) {
        $(el).addClass('active');
      } else {
        $(el).removeClass('active');
      }
    }
  },

  getContent: function() {
    var doc = this.props.doc;
    var surface = this.context.surface;
    var path = this.props.path;
    var text = doc.get(path) || "";

    var annotations = doc.getIndex('annotations').get(path);

    var highlightedAnnotations = [];
    if (this.context.getHighlightedNodes) {
      highlightedAnnotations = this.context.getHighlightedNodes();
    }

    var containerName = surface.getContainerName();

    if (containerName) {
      var anchors = doc.getIndex('container-annotations').get(path, containerName);
      annotations = annotations.concat(anchors);
    }

    var highlights = this.context.getHighlightsForTextProperty(this);
    annotations = annotations.concat(highlights);

    var annotator = new Annotator();
    annotator.onText = function(context, text) {
      context.children.push(text);
    };
    annotator.onEnter = function(entry) {
      var node = entry.node;
      // TODO: we need a component factory, so that we can create the appropriate component
      var ViewClass = AnnotationView;
      var children = [];
      var props = {
          doc: doc,
          node: node,
          classNames: [],
      };
      if (node instanceof ContainerAnnotation.Anchor) {
        ViewClass = AnnotationHandle;
        props.surface = surface;
      } else if (node instanceof TextProperty.Highlight) {
        var highlight = node;
        ViewClass = View;
        var classNames = highlight.classNames || "";
        props.classNames.push(classNames);
        props.tagName = 'span';
        props['data-id'] = highlight.id;
      }
      if (highlightedAnnotations.indexOf(entry.id) >= 0) {
        props.classNames.push('active');
      }
      return {
        ViewClass: ViewClass,
        props: props,
        children: children
      };
    };
    annotator.onExit = function(entry, context, parentContext) {
      var props = context.props;
      props.children = context.children;
      var view = new context.ViewClass(props);
      parentContext.children.push(view);
    };

    var root = { children: [] };
    annotator.start(root, text, annotations);

    return root.children;
  },

  _rerenderAndRecoverSelection: function() {
    this.renderManually();
    this.context.surface.rerenderDomSelection();
  },

  textPropertyDidChange: function(change, info) {
    // HACK: currently without incremental rendering we need to reset the selection after changes.
    // With high rapid incoming keyboard events the CE acts on temporarily invalid selections
    // making the surface fail to detect the correct text input.
    // Using the source element given by surface when handling inserts, we can skip rendering,
    // as this is done by CE already.
    // However can't skip it completely as we need to fixup rendered annotations.
    // The trick here is to debounce the rerendering, so that we stay out of the way of CE during
    // the rapid input phase, and fixup the rendering a bit delayed.
    if (info.source === this.getDOMNode()) {
      if (!this._debouncedRerender) {
        this._debouncedRerender = Substance.debounce(Substance.bind(this._rerenderAndRecoverSelection, this),
          50);
      }
      this._debouncedRerender();
      return;
    }
    // This is called whenever the associated property has been updated or set
    // HACK: container might be out of sync and rerender only works when it's updated
    // So we wait a bit...
    setTimeout(function() {
      // TODO: maybe we want to find an incremental solution
      // However, this is surprisingly fast so that almost no flickering can be observed.
      this.renderManually();
    }.bind(this));
  },

  render: function() {
    return $$((this.props.tagName || 'span'), {
      className: "text-property " + (this.props.className || ""),
      contentEditable: true,
      spellCheck: false,
      style: {
        whiteSpace: "pre-wrap"
      },
      "data-path": this.props.path.join('.')
    });
  },

  getContainer: function() {
    return this.context.surface.getContainer();
  }
});

TextProperty.ContentView = NodeView.extend({
  createElement: function() {
    return document.createDocumentFragment();
  }
});

TextProperty.Highlight = function(range, options) {
  options = options || {};
  this.range = range;
  this.id = options.id;
  this.classNames = options.classNames;
};

Substance.initClass(TextProperty.Highlight);

TextProperty.Highlight.static.level = Number.MAX_VALUE;

module.exports = TextProperty;
