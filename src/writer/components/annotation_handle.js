'use strict';

var Substance = require('substance');
var View = require('./view');
var DomSelection = Substance.Surface.DomSelection;

// TODO: the old implementation is here:
// https://github.com/michael/substance-composer/blob/09d9048c9bfaad2cbc0df72a3e292eb189cffc51/src/workflows/edit_annotation_range.js

var AnnotationHandle = View.extend({
  displayName: "AnnotationHandle",

  _init: function() {
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);

    this.isDragging = false;
    this.wRange = null;
    this.data = null;
  },

  render: function() {
    var $element = $('<span>')
      .addClass(this.props.node.getClassNames().replace(/_/g, '-'))
      .addClass(this.props.classNames)
      .attr('data-id', this.props.node.id);
    var $caret = $('<span>').addClass('anchor-caret');
    $element.append($caret);

    this.$element = $element;
    this.element = $element[0];
    this.$caret = $caret;

    $element.on('mousedown', this._onMouseDown);

    return this.element;
  },

  onMouseDown: function(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('############## Start dragging annotaiton handle....', e, this);

    var annotation = this.props.doc.get(this.props.node.id);
    if (!annotation) {
      console.error('Could not find annotation', this.props.node.id);
      return;
    }

    var surface = this.props.surface;
    if (!surface) {
      console.error('No surface.');
      return;
    }

    var anchor = this.props.node;
    var start = DomSelection.findDomPosition(surface.element, annotation.startPath, annotation.startOffset);
    var end = DomSelection.findDomPosition(surface.element, annotation.endPath, annotation.endOffset);

    if (!start || !end) {
      console.error('Could not map container annotation coordinates.');
      return;
    }

    $(window.document).on('mousemove', this._onMouseMove);
    $(window.document).on('mouseup', this._onMouseUp);
    this.isDragging = true;

    var sel = window.getSelection();
    var wRange = window.document.createRange();
    var focus;
    if (anchor.isStart) {
      wRange.setStart(end.node, end.offset);
      focus = start;
    } else {
      wRange.setStart(end.node, end.offset);
      focus = end;
    }
    sel.addRange(wRange);
    sel.extend(focus.node, focus.offset);
  },

  _getPositionFromPoint: function(ev) {
    var range, textNode, offset;
    // standard
    if (window.document.caretPositionFromPoint) {
      range = window.document.caretPositionFromPoint(ev.clientX, ev.clientY);
      textNode = range.offsetNode;
      offset = range.offset;
    // WebKit
    } else if (window.document.caretRangeFromPoint) {
      range = window.document.caretRangeFromPoint(ev.clientX, ev.clientY);
      textNode = range.startContainer;
      offset = range.startOffset;
    } else {
      console.error('Browser not supported');
      return;
    }
    return { startContainer: textNode, startOffset: offset };
  },

  onMouseMove: function(e) {
    if (this.isDragging) {
      e.stopPropagation();
      e.preventDefault();
      var position = this._getPositionFromPoint(e);
      var wSel = window.getSelection();
      wSel.extend(position.startContainer, position.startOffset);
    }
  },

  onMouseUp: function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(window.document).off('mousemove', this._onMouseMove);
    $(window.document).off('mouseup', this._onMouseUp);

    console.log('############## Stop dragging annotation handle....');
    this.isDragging = false;
    var sel = window.getSelection();
    if (sel.rangeCount > 0) {
      var doc = this.props.doc;
      var surface = this.props.surface;
      var anchor = this.props.node;
      var newSelection = DomSelection.getSelectionForDomSelection(sel, {
        containerName: anchor.container
      });
      if (!newSelection || newSelection.isNull()) {
        console.error('No selection.');
        return;
      }
      console.log('... New selection', newSelection.toString());
      var range = newSelection.getRange();
      var tx = doc.startTransaction({selection: surface.getSelection()});
      try {
        var id = anchor.id;
        if(anchor.isStart) {
          tx.set([id, 'startPath'], range.start.path);
          tx.set([id, 'startOffset'], range.start.offset);
        } else {
          tx.set([id, 'endPath'], range.end.path);
          tx.set([id, 'endOffset'], range.end.offset);
        }
        tx.save({ selection: newSelection });
      } finally {
        tx.cleanup();
      }
    }
  },

});

module.exports = AnnotationHandle;
