var $$ = React.createElement;
var Substance = require("substance");
var Scrollbar = require("../scrollbar");
var _ = require("substance/helpers");
var PanelMixin = require("../panel_mixin");

var ContentPanelMixin = _.extend({}, PanelMixin, {

  contextTypes: {
    app: React.PropTypes.object.isRequired,
    componentRegistry: React.PropTypes.object.isRequired,
  },

  // Since component gets rendered multiple times we need to update
  // the scrollbar and reattach the scroll event
  componentDidMount: function() {
    var app = this.context.app;
    this.updateScrollbar();
    $(window).on('resize', this.updateScrollbar);

    var doc = app.doc;
    doc.connect(this, {
      'document:changed': this.onDocumentChange,
      'app:toc-entry-selected': this.onTOCEntrySelected
    });
  },

  componentWillUnmount: function() {
    var app = this.context.app;
    var doc = app.doc;
    doc.disconnect(this);
    $(window).off('resize');
  },

  onDocumentChange: function() {
    setTimeout(function() {
      this.updateScrollbar();
    }.bind(this), 0);
  },

  onTOCEntrySelected: function(nodeId) {
    this.scrollToNode(nodeId);
  },

  componentDidUpdate: function() {
    this.updateScrollbar();
  },

  updateScrollbar: function() {
    var scrollbar = this.refs.scrollbar;
    var panelContentEl = this.refs.panelContent.getDOMNode();

    // We need to await next repaint, otherwise dimensions will be wrong
    Substance.delay(function() {
      scrollbar.update(panelContentEl, this);
    }.bind(this),0);

    // (Re)-Bind scroll event on new panelContentEl
    $(panelContentEl).off('scroll');
    $(panelContentEl).on('scroll', this._onScroll);
  },


  _onScroll: function(e) {
    var panelContentEl = this.refs.panelContent.getDOMNode();
    this.refs.scrollbar.update(panelContentEl, this);
    this.markActiveTOCEntry();
  },

  markActiveTOCEntry: function() {
    var panelContentEl = this.refs.panelContent.getDOMNode();

    var contentHeight = this.getContentHeight();
    var panelHeight = this.getPanelHeight();
    var scrollTop = this.getScrollPosition();

    var scrollBottom = scrollTop + panelHeight;

    var regularScanline = scrollTop;
    var smartScanline = 2 * scrollBottom - contentHeight;
    var scanline = Math.max(regularScanline, smartScanline);

    $('.scanline').css({
      top: (scanline - scrollTop)+'px'
    });

    // TODO: this should be generic
    var headings = $(panelContentEl).find('.content-node.heading');

    if (headings.length === 0) return;

    // Use first heading as default
    var activeNode = _.first(headings).dataset.id;
    headings.each(function() {
      if (scanline >= $(this).position().top) {
        activeNode = this.dataset.id;
      }
    });

    var doc = this.getDocument();
    doc.emit('app:toc-entry:changed', activeNode);
  },


  // Rendering
  // -----------------

  getContentEditor: function() {
    var app = this.context.app;
    var doc = app.doc;

    var componentRegistry = this.context.componentRegistry;
    // FIXME: this is called getContentEditor() but requires 'content_container'
    var ContentContainerClass = componentRegistry.get("content_container");
    if (!ContentContainerClass) {
      ContentContainerClass = componentRegistry.get("content_editor")
    }

    return $$(ContentContainerClass, {
      doc: doc,
      node: doc.get("content"),
      ref: "contentEditor"
    });
  },

  render: function() {
    var app = this.context.app;

    return $$("div", {className: "panel content-panel-component"}, // usually absolutely positioned
      $$(Scrollbar, {
        id: "content-scrollbar",
        contextId: app.state.contextId,
        highlights: app.getHighlightedNodes.bind(app),
        ref: "scrollbar"
      }),
      $$('div', {className: 'scanline'}),
      $$('div', {className: "panel-content", ref: "panelContent"}, // requires absolute positioning, overflow=auto
        this.getContentEditor()
      )
    );
  }
});

var ContentPanel = React.createClass({
  mixins: [ContentPanelMixin],
  displayName: "ContentPanel",
});

module.exports = ContentPanel;