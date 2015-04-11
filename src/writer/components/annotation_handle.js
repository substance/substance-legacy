'use strict';

var Substance = require('substance');
var View = require('./view');
var DomSelection = Substance.Surface.DomSelection;

var AnnotationHandle = View.extend({
  displayName: "AnnotationHandle",

  render: function() {
    var $element = $('<span>')
      .addClass(this.props.node.getClassNames().replace(/_/g, '-'))
      .addClass(this.props.classNames.join(' '))
      .attr('data-id', this.props.node.id);
    this.$element = $element;
    this.element = $element[0];
    return this.element;
  },

});

module.exports = AnnotationHandle;
