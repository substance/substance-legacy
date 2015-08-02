"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

var THUMB_MIN_HEIGHT = 7;

// A rich scrollbar implementation that supports highlights
// ----------------

function Scrollbar() {
  Component.apply(this, arguments);

  this.onMouseDown = this.onMouseDown.bind(this);
  this.onMouseUp = this.onMouseUp.bind(this);
  this.onMouseMove = this.onMouseMove.bind(this);
}

Scrollbar.Prototype = function() {

  this.getInitialState = function() {
    return {
      thumb: {top: 0, height: 20}, // just render at the top
      highlights: [] // no highlights until state derived
    };
  };

  this.didMount = function() {
     // HACK global window object!
     // TODO: why is this done?
     $(window).on('mousemove', this.mouseMove);
     $(window).on('mouseup', this.mouseUp);
     this.$el.on('mousedown', this.onMouseDown);
  };

  this.willUnmount = function() {
     $(window).off('mousemove', this.mouseMove);
     $(window).off('mouseup', this.mouseUp);
     this.$el.off('mousedown', this.onMouseDown);
  };

  this.getClassNames = function() {
    return 'scrollbar-component'+this.props.contextId;
  };

  this.render = function() {
    var highlightEls = this.state.highlights.map(function(h) {
     return $$('div', {
        classNames: 'highlight',
        key: h.id,
        style: {
          top: h.top,
          height: h.height
        }
      });
    });
    var thumbEl = $$('div', {
      ref: "thumb",
      classNames: "thumb",
      style: {
        top: this.state.thumb.top,
        height: Math.max(this.state.thumb.height, THUMB_MIN_HEIGHT)
      }
    });
    return [
      thumbEl,
      $$('div', {classNames: 'highlights'}, highlightEls)
    ];
  };

  this.update = function(panelContentEl, panel) {
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
      };
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
  };

  this.onMouseDown = function(e) {
    e.stopPropagation();
    e.preventDefault();
    this._mouseDown = true;
    var scrollBarOffset = this.$el.offset().top;
    var y = e.pageY - scrollBarOffset;
    var thumbEl = this.refs.thumb.getDOMNode();
    if (e.target !== thumbEl) {
      // Jump to mousedown position
      this.offset = $(thumbEl).height()/2;
      this.mouseMove(e);
    } else {
      this.offset = y - $(thumbEl).position().top;
    }
  };

  // Handle Mouse Up
  // -----------------
  //
  // Mouse lifted, nothis.panelContentEl scroll anymore

  this.onMouseUp = function() {
    this._mouseDown = false;
  };

  // Handle Scroll
  // -----------------
  //
  // Handle scroll event
  // .visible-area handle

  this.onMouseMove = function(e) {
    if (this._mouseDown) {
      var scrollBarOffset = this.$el.offset().top;
      var y = e.pageY - scrollBarOffset;
      // find offset to visible-area.top
      var scroll = (y-this.offset)*this.factor;
      this.scrollTop = $(this.panelContentEl).scrollTop(scroll);
    }
  };
};

OO.inherit(Scrollbar, Component);

Scrollbar.overlayMinHeight = 5;

module.exports = Scrollbar;
