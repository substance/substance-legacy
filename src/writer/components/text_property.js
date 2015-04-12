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
    return { activeContainerAnnotations: [] };
  },

  shouldComponentUpdate: function() {
    // Highlights are treated incrementally because this is triggered by cursor
    // movement and it would be bad to loose the cursor due to rerender.
    this.updateHighlights();
    // For container annotation changes this is different, as we can loose the
    // selection
    // var annos = null;
    // // TODO: is there a better place to update the internal state?
    // var oldAnnos = this.state.activeContainerAnnotations;
    // if (this.context.getActiveContainerAnnotations) {
    //  annos = this.context.getActiveContainerAnnotations();
    // }
    // this.state.activeContainerAnnotations = annos;
    // // container annotatins have changed
    // if (!Substance.isEqual(oldAnnos, annos)) {
      this.renderManually();
    // }

    return false;
  },

  componentDidMount: function() {
    var doc = this.props.doc;
    var surface = this.context.surface;
    doc.getEventProxy('path').add(this.props.path, this, this.propertyDidChange);
    surface.containerAnnotationEvents.add(this.props.path, this, this.renderManually);
    this.renderManually();
  },

  componentWillUnmount: function() {
    var doc = this.props.doc;
    var surface = this.context.surface;
    doc.getEventProxy('path').remove(this.props.path, this);
    surface.containerAnnotationEvents.remove(this.props.path, this);
  },

  renderManually: function() {
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


  propertyDidChange: function(change, info) {
    // Note: Surface provides the source element as element
    // whenever editing is done by Contenteditable (as opposed to programmatically)
    // In that case we trust in CE and do not rerender.
    if (info.source === this.getDOMNode()) {
      // console.log('Skipping update...');
      return;
    }
    // TODO: maybe we want to find an incremental solution
    // However, this is surprisingly fast so that almost no flickering can be observed.
    this.renderManually();
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
