'use strict';

var Substance = require('../basics');
var Range = require('./range');
var Coordinate = require('./coordinate');

function PropertySelection(range, reverse) {
  this.range = range;
  this.reverse = reverse;
}

PropertySelection.Prototype = function() {

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
    if (this === other) return true;
    else if (this.reverse === other.reverse) {
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
    return "( " + JSON.stringify(this.range.start.path) +", "
      + this.range.start.offset + " -> " + this.range.end.offset
      + (this.reverse?", reverse":"")
      + (this.range.start.after?", after":"")
      + " )";
  };

};

Substance.initClass(PropertySelection);

PropertySelection.create = function(path, startOffset, endOffset) {
  // == checks for null and undefined
  /* jshint eqnull:true */
  if (!path || startOffset == null) {
    throw new Error('Illegal Argument');
  }
  if (endOffset == null) {
    endOffset = startOffset;
  }
  var start = new Coordinate(path, startOffset);
  var end, reverse;
  if (endOffset === startOffset) {
    end = start;
  } else {
    if (startOffset < endOffset) {
      reverse = false;
      end = new Coordinate(path, endOffset);
    } else {
      reverse = true;
      end = start;
      start = new Coordinate(path, endOffset);
    }
  }
  var range = new Range(start, end);
  return new PropertySelection(range, reverse);
};

module.exports = PropertySelection;
