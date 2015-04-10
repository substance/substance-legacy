var $$ = React.createElement;
var Substance = require("substance");
var Scrollbar = require("./scrollbar");

var ContentPanel = React.createClass({
  displayName: "ContentPanel",

  // Since component gets rendered multiple times we need to update
  // the scrollbar and reattach the scroll event
  componentDidMount: function() {
    this.updateScrollbar();
    $(window).resize(this.updateScrollbar);
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
        highlights: writerCtrl.getHighlightedNodes(),
        ref: "scrollbar"
      }),

      $$('div', {className: "panel-content", ref: "panelContent"}, // requires absolute positioning, overflow=auto
        this.getContentEditor()
      )
    );
  }
});

module.exports = ContentPanel;