var Substance = require('substance');
var $$ = React.createElement;

var TextProperty = Substance.Surface.TextProperty;

// TextPropertyComponent
// ----------------
//

var TextPropertyComponent = React.createClass(Substance.extend({}, TextProperty.prototype, {

  displayName: "TextProperty",

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
    doc.getEventProxy('path').add(this.props.path, this, this.textPropertyDidChange);
    // HACK: a guard so that we do not render manually when this is unmounted
    this.__mounted__ = true;
    // Note: even if we don't need to render in surfaces with container (~two-pass rendering)
    // we still need to render this in the context of fornm-editors.
    this.renderManually();
  },

  componentWillUnmount: function() {
    var doc = this.props.doc;
    doc.getEventProxy('path').remove(this.props.path, this);
    this.__mounted__ = false;
  },

  render: function() {
    return $$((this.props.tagName || 'span'), {
      className: "text-property " + (this.props.className || ""),
      // contentEditable: true,
      spellCheck: false,
      style: {
        whiteSpace: "pre-wrap"
      },
      "data-path": this.props.path.join('.')
    });
  },

  renderManually: function() {
    // HACK: it happened that this is called even after this component had been mounted.
    // We need to track these situations and fix them in the right place.
    // However, we leave it here for a while to increase stability,
    // as these occasions are not critical for the overall functionality.
    if(!this.__mounted__) {
      console.warn('Tried to render an unmounted TextPropertyComponent.');
      return;
    }
    this.renderContent();
    this.updateHighlights();
  },

  getAnnotations: function() {
    var doc = this.props.doc;
    var surface = this.context.surface;
    var path = this.props.path;
    var annotations = doc.getIndex('annotations').get(path);

    var containerName = surface.getContainerName();
    if (containerName) {
      var anchors = doc.getIndex('container-annotations').get(path, containerName);
      annotations = annotations.concat(anchors);
    }

    var highlights = this.context.getHighlightsForTextProperty(this);
    annotations = annotations.concat(highlights);

    return annotations;
  },

  // Annotations that are active (not just visible)
  // The ones that have will get an .active class
  getHighlights: function() {
    return this.context.getHighlightedNodes();
  },

  updateHighlights: function() {
    if (!this.context.getHighlightedNodes) return;
    var highlightedAnnotations = this.context.getHighlightedNodes();
    var domNode = this.getDOMNode();
    var els = $(domNode).find('.annotation, .container-annotation');
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
      // Note: to see the effect of this you can for example edit a paragraph
      // which is spanned by a container annotation. With this deactivated
      // the text will not be renders as annotated text.
      // Reason is, we just let CE update the element. Of course, it does not
      // consider the annotations. When the input storm is over, we take the
      // time to render the element properly.
      if (!this._debouncedRerender) {
        var INTERVAL = 200; //ms
        this._debouncedRerender = Substance.debounce(Substance.bind(this._rerenderAndRecoverSelection, this), INTERVAL);
      }
      this._debouncedRerender();
      return;
    }
    // TODO: maybe we want to find an incremental solution
    // However, this is surprisingly fast so that almost no flickering can be observed.
    this.renderManually();
  },

  getContainer: function() {
    return this.context.surface.getContainer();
  },

  getDocument: function() {
    return this.props.doc;
  },

  getPath: function() {
    return this.props.path;
  },

  getElement: function() {
    return this.getDOMNode();
  },

}));

TextPropertyComponent.Highlight = function(path, startOffset, endOffset, options) {
  options = options || {};
  this.id = options.id;
  this.path = path;
  this.startOffset = startOffset;
  this.endOffset = endOffset;
  this.classNames = options.classNames;
};

Substance.initClass(TextPropertyComponent.Highlight);

TextPropertyComponent.Highlight.prototype.getClassNames = function() {
  return this.classNames;
};

TextPropertyComponent.Highlight.static.level = Number.MAX_VALUE;

module.exports = TextPropertyComponent;
