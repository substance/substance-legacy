'use strict';

var Substance = require('../basics');
var _ = require('../basics/helpers');
var PropertySelection = require('./property_selection');

function TableSelection(range, tableId, rectangle, reverse) {
  this.tableId = tableId;
  this.rectangle = rectangle;
  this._isSingleCell = _.isEqual(range.start.path, range.end.path);
  // calling this afterwards as it calls freeze
  PropertySelection.call(this, range, reverse);
}

TableSelection.Prototype = function() {

  this.isPropertySelection = function() {
    return this._isSingleCell;
  };

  this.isTableSelection = function() {
    return true;
  };

  this.getTableId = function() {
    return this.tableId;
  };

  this.getRectangle = function() {
    return this.rectangle;
  };

  this.equals = function(other) {
    if (this === other) {
      return true ;
    } else if (!other) {
      return false;
    } else if (!other.isTableSelection()) {
      return false;
    } else {
      return (this.startRow === other.startRow && this.endRow === other.endRow &&
        this.startCol === other.startCol && this.ednCol === other.endCol );
    }
  };

  this.toString = function() {
    var r = this.rectangle;
    return "T[("+ r.start.row + "," + r.start.col + "), ("+ r.end.row + ", " + r.end.col +")]";
  };

  this.createWithNewRange = function(startOffset, endOffset) {
    return new TableSelection(
      new Range(new Coordinate(this.path, startOffset), new Coordinate(this.path, endOffset)),
        this.tableId, this.rectangle);
  };

};

Substance.inherit(TableSelection, PropertySelection);

TableSelection.Rectangle = function(startRow, startCol, endRow, endCol) {
  this.start = {
    row: startRow,
    col: startCol
  };
  this.end = {
    row: endRow,
    col: endCol
  };
  Object.freeze(this.start);
  Object.freeze(this.end);
  Object.freeze(this);
};

TableSelection.create = function(range, tableId, startRow, startCol, endRow, endCol, reverse) {
  var tmp;
  if (startCol > endCol) {
    tmp = startCol
    startCol = endCol;
    endCol = tmp;
  }
  if (startRow > endRow) {
    tmp = startRow;
    startRow = endRow;
    endRow = tmp;
  }
  return new TableSelection(range, tableId, new TableSelection.Rectangle(startRow, startCol, endRow, endCol), reverse)
}

module.exports = TableSelection;
