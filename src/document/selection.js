'use strict';

var Substance = require('../basics');
var PropertySelection = require('./property_selection');

function Selection() {
}

Selection.Prototype = function() {

  this.isNull = function() {
    return true;
  };

  this.getRanges = function() {
    return []
  };

  this.isMultiSeletion = function() {
    false;
  };

  this.isPropertySelection = function() {
    false;
  };

  this.isCollapsed = function() {
    return true;
  };

  this.isReverse = function() {
    return false;
  };

  this.equals = function(other) {
    return this === other;
  };

  this.toString = function() {
    return "null";
  };

  this.collapse = function(direction) {
    if (direction === 'left') {
      return new PropertySelection(new Range(this.range.start, this.range.start));
    } else {
      return new PropertySelection(new Range(this.range.end, this.range.end));
    }
  };

};

Substance.initClass(Selection);

Selection.NullSelection = Object.freeze(new Selection());

module.exports = Selection;
