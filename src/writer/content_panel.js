var $$ = React.createElement;
var Substance = require("substance");
var Scrollbar = require("./scrollbar");
var _ = require("substance/helpers");
var PanelMixin = require("./panel_mixin");

var ContentPanelMixin = _.extend({}, PanelMixin, {

  // Since component gets rendered multiple times we need to update
  // the scrollbar and reattach the scroll event
  componentDidMount: function() {
    this.updateScrollbar();
    $(window).on('resize', this.updateScrollbar);

    var doc = this.props.writerCtrl.doc;
    doc.connect(this, {
      'document:changed': this.onDocumentChange
    });
  },

  componentWillUnmount: function() {
    doc.disconnect(this);
    $(window).off('resize');
  },

  onDocumentChange: function() {
    setTimeout(function() {
      this.updateScrollbar();
    }.bind(this), 0);
  },

  componentDidUpdate: function() {
    this.updateScrollbar();
  },

  updateScrollbar: function() {
    var scrollbar = this.refs.scrollbar;
    var panelContentEl = this.refs.panelContent.getDOMNode();

    // We need to await next repaint, otherwise dimensions will be wrong
    Substance.delay(function() {
      scrollbar.update(panelContentEl);  
    },0);

    // (Re)-Bind scroll event on new panelContentEl
    $(panelContentEl).off('scroll');
    $(panelContentEl).on('scroll', this._onScroll);
  },

  _onScroll: function(e) {
    var panelContentEl = this.refs.panelContent.getDOMNode();
    this.refs.scrollbar.update(panelContentEl);
  },

  // Rendering
  // -----------------

  getContentEditor: function() {
    var writerCtrl = this.props.writerCtrl;
    var doc = writerCtrl.doc;
    var ContainerClass = writerCtrl.getNodeComponentClass("container");

    return $$(ContainerClass, {
      writerCtrl: writerCtrl,
      doc: doc,
      node: doc.get("content"),
      ref: "contentEditor"
    });
  },

  render: function() {
    var writerCtrl = this.props.writerCtrl;

    return $$("div", {className: "panel content-panel-component"}, // usually absolutely positioned
      $$(Scrollbar, {
        id: "content-scrollbar",
        contextId: writerCtrl.getState().contextId,
        highlights: writerCtrl.getHighlightedNodes.bind(writerCtrl),
        ref: "scrollbar"
      }),

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