'use strict';

var Component = require('../component');
var $$ = Component.$$;
var _ = require('../../basics/helpers');

var Panel = require("./panel");
var Scrollbar = require("./scrollbar");

class ContentPanel extends Panel {

  // Since component gets rendered multiple times we need to update
  // the scrollbar and reattach the scroll event
  didMount() {
    this.updateScrollbar();
    $(window).on('resize', this.updateScrollbar);
    this.props.doc.connect(this, {
      'document:changed': this.onDocumentChange,
      'toc:entry-selected': this.onTOCEntrySelected
    }, -1);
  }

  willUnmount() {
    $(window).off('resize');
    this.props.doc.disconnect(this);
  }

  onDocumentChange() {
    this.updateScrollbar();
  }

  onTOCEntrySelected(nodeId) {
    this.scrollToNode(nodeId);
  }

  updateScrollbar() {
    var scrollbar = this.refs.scrollbar;
    var $panelContent = this.refs.panelContent.$el;
    // We need to await next repaint, otherwise dimensions will be wrong
    _.delay(function() {
      scrollbar.update($panelContent[0], this);
    }.bind(this),0);
    // (Re)-Bind scroll event on new panelContentEl
    $panelContent.off('scroll');
    $panelContent.on('scroll', this._onScroll);
  }

  onScroll() {
    var $panelContent = this.refs.panelContent.$el;
    this.refs.scrollbar.update($panelContent[0], this);
    this.markActiveTOCEntry();
  }

  markActiveTOCEntry() {
    var $panelContent = this.refs.panelContent.$el;

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
    var headings = $panelContent.find('.content-node.heading');
    if (headings.length === 0) return;
    // Use first heading as default
    var activeNode = _.first(headings).dataset.id;
    headings.each(function() {
      if (scanline >= $(this).position().top) {
        activeNode = this.dataset.id;
      }
    });

    var doc = this.getDocument();
    doc.emit('toc:entry-focused', activeNode);
  }

  // Rendering
  // -----------------

  get classNames() {
    return "panel content-panel-component";
  }

  render() {
    return [
      $$(Scrollbar, {
        id: "content-scrollbar",
        key: "scrollbar"
      }),
      $$('div', {classNames: 'scanline'}),
      $$('div', {key: "panelContent", classNames: "panel-content"}, // requires absolute positioning, overflow=auto
        this.getContentEditor()
      )
    ];
  }

  renderContentEditor() {
    var componentRegistry = this.context.componentRegistry;
    var doc = this.props.doc;
    // FIXME: this is called getContentEditor() but requires 'content_container'
    var ContentContainerClass = componentRegistry.get("content_container");
    if (!ContentContainerClass) {
      ContentContainerClass = componentRegistry.get("content_editor");
    }
    return $$(ContentContainerClass, {
      key: "contentEditor",
      doc: doc,
      node: doc.get("content"),
    });
  }
}

module.exports = ContentPanel;