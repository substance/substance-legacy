'use strict';

var Substance = require('substance');
var View = require('./view');
var DomSelection = Substance.Surface.DomSelection;

// TODO: the old implementation is here:
// https://github.com/michael/substance-composer/blob/09d9048c9bfaad2cbc0df72a3e292eb189cffc51/src/workflows/edit_annotation_range.js

var AnnotationHandle = View.extend({
  displayName: "AnnotationHandle",

  render: function() {
    var $element = $('<span>')
      .addClass(this.props.node.getClassNames().replace(/_/g, '-'))
      .addClass(this.props.classNames.join(' '))
      .attr('data-id', this.props.node.id);
    // var $caret = $('<span>').addClass('anchor-caret');
    // $element.append($caret);

    this.$element = $element;
    this.element = $element[0];
    // this.$caret = $caret;

    // NOTE: we deactivated the draggable handle implementation.
    return this.element;
  },

});

module.exports = AnnotationHandle;
