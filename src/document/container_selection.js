'use strict';

var Substance = require('../basics');
var Range = require('./range');
var Coordinate = require('./coordinate');
var PropertySelection = require('./property_selection');

function ContainerSelection(container, range, reverse) {
  this.range = range;
  this.reverse = reverse;
  this.collapsed = range.start.equals(range.end);
  Object.freeze(this.range);
}

ContainerSelection.Prototype = function() {

  this.isPropertySelection = function() {
    return false;
  };

  this.isContainerSelection = function() {
    return true;
  };

  this.toString = function() {
    return "(" + JSON.stringify(this.range.start.path) + ":" + this.range.start.offset + ") -> (" +  JSON.stringify(this.range.end.path) + ":" + this.range.end.offset + (this.reverse ? "; reverse" : "") + ")";
  };

};

Substance.inherit(ContainerSelection, PropertySelection);

ContainerSelection.create = function(container, startPath, startOffset, endPath, endOffset) {
  /* jshint eqnull:true */
  if (!container || !startPath || startOffset == null) {
    throw new Error('Illegal Arguments');
  }
  if (endPath == null) {
    endPath = startPath;
  }
  if (endOffset == null) {
    endOffset = startOffset;
  }
  var start = new Coordinate(startPath, startOffset);
  var startPos = container.getPosition(startPath);
  var end;
  var endPos;
  var reverse;
  if (Substance.isArrayEqual(startPath, endPath) && endOffset === startOffset) {
    end = start;
    endPos = startPos;
  } else {
    endPos = container.getPosition(endPath);
    if (startPos < endPos) {
      reverse = false;
    } else if (startPos === endPos) {
      reverse = (startOffset < endOffset);
    } else {
      reverse = true;
    }
    if (reverse) {
      end = start;
      start = new Coordinate(endPath, endOffset);
    } else {
      end = new Coordinate(endPath, endOffset);
    }
  }
  var range = new Range(start, end);

  var sel = new ContainerSelection(container, range, reverse);
  return sel;
};


module.exports = ContainerSelection;