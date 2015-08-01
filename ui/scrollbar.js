"use strict";

var $$ = React.createElement;
var _ = require("substance/helpers");

// A rich scrollbar implementation that supports highlights
// ----------------

var THUMB_MIN_HEIGHT = 7;

var Scrollbar = React.createClass({
  displayName: "Scrollbar",

  getInitialState: function() {
    return {
      thumb: {top: 0, height: 20}, // just render at the top
      highlights: [] // no highlights until state derived
    };
  },

  componentDidMount: function() {
     // HACK global window object!
     $(window).mousemove(this.mouseMove);
     $(window).mouseup(this.mouseUp);
  },

  mouseDown: function(e) {
    this._mouseDown = true;
    var scrollBarOffset = $(React.findDOMNode(this)).offset().top;
    var y = e.pageY - scrollBarOffset;
    var thumbEl = this.refs.thumb.getDOMNode();

    if (e.target !== thumbEl) {
      // Jump to mousedown position
      this.offset = $(thumbEl).height()/2;
      this.mouseMove(e);
    } else {
      this.offset = y - $(thumbEl).position().top;
    }
    return false;
  },

  // Handle Mouse Up
  // -----------------
  //
  // Mouse lifted, no scroll anymore

  mouseUp: function() {
    this._mouseDown = false;
  },

  // Handle Scroll
  // -----------------
  //
  // Handle scroll event
  // .visible-area handle

  mouseMove: function(e) {
    if (this._mouseDown) {
      var scrollBarOffset = $(React.findDOMNode(this)).offset().top;
      var y = e.pageY - scrollBarOffset;

      // find offset to visible-area.top
      var scroll = (y-this.offset)*this.factor;
      this.scrollTop = $(this.panelContentEl).scrollTop(scroll);
    }
  },

  update: function(panelContentEl, panel) {
    var self = this;

    this.panelContentEl = panelContentEl;

    var contentHeight = panel.getContentHeight();
    var panelHeight = panel.getPanelHeight();
    var scrollTop = panel.getScrollPosition();

    // Needed for scrollbar interaction
    this.factor = (contentHeight / panelHeight);

    var highlights = [];
    // Compute highlights
    this.props.highlights().forEach(function(nodeId) {
      var nodeEl = $(self.panelContentEl).find('*[data-id='+nodeId+']');
      if (!nodeEl.length) return;

      var top = nodeEl.position().top / self.factor;
      var height = nodeEl.outerHeight(true) / self.factor;

      // HACK: make all highlights at least 3 pxls high, and centered around the desired top pos
      if (height < Scrollbar.overlayMinHeight) {
        height = Scrollbar.overlayMinHeight;
        top = top - 0.5 * Scrollbar.overlayMinHeight;
      }

      var data = {
        id: nodeId,
        top: top,
        height: height
      }
      highlights.push(data);
    });

    var thumbProps = {
     top: scrollTop / this.factor,
     height: panelHeight / this.factor
    };

    this.setState({
      thumb: thumbProps,
      highlights: highlights
    });
  },

  render: function() {
    var highlightEls = this.state.highlights.map(function(h) {

     return $$('div', {
        className: 'highlight',
        key: h.id,
        style: {
          top: h.top,
          height: h.height
        }
      });
    });

    var thumbEl = $$('div', {
      ref: "thumb",
      className: "thumb",
      style: {
      top: this.state.thumb.top,
      height: Math.max(this.state.thumb.height, THUMB_MIN_HEIGHT)
     }
    });

    return $$("div", {className: "scrollbar-component "+this.props.contextId, onMouseDown: this.mouseDown},
      thumbEl,
      $$('div', {className: 'highlights'}, 
       highlightEls
      )
    );
  }
});

Scrollbar.overlayMinHeight = 5

module.exports = Scrollbar;
