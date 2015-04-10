'use strict';

var Substance = require('../basics');
var Selection = require('./selection');

function PropertySelection(range, reverse) {
  this.range = range;
  this.reverse = reverse;
  Object.freeze(this);
}

PropertySelection.Prototype = function() {

  Substance.extend(this, Selection.prototype);

  this.isNull = function() {
    return false;
  };

  this.getRanges = function() {
    return [this.range];
  };

  this.getRange = function() {
    return this.range;
  };

  this.isCollapsed = function() {
    return this.range.isCollapsed();
  };

  this.isReverse = function() {
    return this.reverse;
  };

  this.isPropertySelection = function() {
    return true;
  };

  this.isMultiSeletion = function() {
    return false;
  };

  this.equals = function(other) {
    if (this === other) {
      return true ;
    } else if (other.isNull()) {
      return false;
    } else if (this.reverse === other.reverse) {
      return this.range.equals(other.range);
    }
  };

  // Helper Methods
  // ----------------------

  this.getPath = function() {
    return this.range.start.path;
  };

  this.getTextRange = function() {
    return [this.range.start.offset, this.range.end.offset];
  };

  this.toString = function() {
    return [
      "( ", JSON.stringify(this.range.start.path), ", ",
        this.range.start.offset, " -> ", this.range.end.offset,
        (this.reverse?", reverse":""),
        (this.range.start.after?", after":""),
      " )"
    ].join('');
  };
};

Substance.inherit(PropertySelection, Selection);

module.exports = PropertySelection;
