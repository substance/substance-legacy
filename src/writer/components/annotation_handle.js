var View = require('./view');

// TODO: the old implementation is here:
// https://github.com/michael/substance-composer/blob/09d9048c9bfaad2cbc0df72a3e292eb189cffc51/src/workflows/edit_annotation_range.js

var AnnotationHandle = View.extend({
  displayName: "AnnotationHandle",

  _init: function() {
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);

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
    $(window.document).on('mouseup', this._onMouseUp);

    console.log('############## Start dragging annotaiton handle....');

  },

  onMouseMove: function(e) {
  },

  onMouseUp: function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(window.document).off('mouseup', this._onMouseUp);

    console.log('############## Stop dragging annotation handle....');
  },

});

module.exports = AnnotationHandle;
