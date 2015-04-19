'use strict';

var Substance = require('../basics');
var Selection = require('./selection');

function PropertySelection(range, reverse) {
  this.range = range;
  this.reverse = reverse;
  this._internal = {};
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
    return (
      Selection.prototype.equals(other) &&
      this.range.equals(other.range)
    );
  };

  this.collapse = function(direction) {
    var coor;
    if (direction === 'left') {
      coor = this.range.start;
    } else {
      coor = this.range.end;
    }
    return Selection.create(coor);
  };

  // Helper Methods
  // ----------------------

  this.getPath = function() {
    return this.range.start.path;
  };

  this.getStartOffset = function() {
    return this.range.start.offset;
  };

  this.getEndOffset = function() {
    return this.range.end.offset;
  };

  this.toString = function() {
    return [
      "PropertySelection(", JSON.stringify(this.range.start.path), ", ",
        this.range.start.offset, " -> ", this.range.end.offset,
        (this.reverse?", reverse":""),
        (this.range.start.after?", after":""),
      ")"
    ].join('');
  };

  this.isInside = function(other) {

  };

  this.overlaps = function(other) {

  };

  this.isRightAligned = function(other) {

  };

  this.isLeftAligned = function(other) {

  };

};

Substance.inherit(PropertySelection, Selection);

Object.defineProperties(PropertySelection.prototype, {
  start: {
    get: function() {
      return this.range.start;
    },
    set: function() { throw new Error('immutable.'); }
  },
  end: {
    get: function() {
      return this.range.end;
    },
    set: function() { throw new Error('immutable.'); }
  },
});

module.exports = PropertySelection;
