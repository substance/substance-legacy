'use strict';

var Substance = require('../basics');
var _ = require('../basics/helpers');
var Selection = require('./selection');

function TableSelection(tableId, startRow, startCol, endRow, endCol) {
  this.tableId = tableId;
  if (arguments.length === 2 && arguments[1] instanceof TableSelection.Rectangle) {
    this.rectangle = arguments[1];
  } else {
    this.rectangle = new TableSelection.Rectangle(startRow, startCol, endRow, endCol);
  }
  this._internal = {};
  Object.freeze(this);
}

TableSelection.Prototype = function() {

  this.isPropertySelection = function() {
    return false;
  };

  this.isTableSelection = function() {
    return true;
  };

  this.isSingleCell = function() {
    return this.rectangle.isSingleCell();
  };

  this.getTableId = function() {
    return this.tableId;
  };

  this.getRectangle = function() {
    return this.rectangle;
  };

  this.equals = function(other) {
    if (other === this) {
      return true;
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

  this.attach = function(doc) {
    this._internal.doc = doc;
    return this;
  };

};

Substance.inherit(TableSelection, Selection);

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

TableSelection.Rectangle.prototype.isSingleCell = function() {
  return (this.start.row === this.end.row && this.start.col === this.end.col);
};

TableSelection.Rectangle.create = function(startRow, startCol, endRow, endCol) {
  var minRow = Math.min(startRow, endRow);
  var maxRow = Math.max(startRow, endRow);
  var minCol = Math.min(startCol, endCol);
  var maxCol = Math.max(startCol, endCol);
  return new TableSelection.Rectangle(minRow, minCol, maxRow, maxCol);
};

TableSelection.create = function(tableId, startRow, startCol, endRow, endCol) {
  var tmp;
  if (startCol > endCol) {
    tmp = startCol;
    startCol = endCol;
    endCol = tmp;
  }
  if (startRow > endRow) {
    tmp = startRow;
    startRow = endRow;
    endRow = tmp;
  }
  return new TableSelection(tableId, new TableSelection.Rectangle(startRow, startCol, endRow, endCol));
};

module.exports = TableSelection;
