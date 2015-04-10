var Substance = require('../basics');
var PropertySelection = require('./property_selection');
var ContainerSelection = require('./container_selection');
var Coordinate = require('./coordinate');
var Range = require('./range');

// create(range, [, reverse]) -> creates a PropertySelection
// create(coor, [, reverse]) -> creates a collapsed PropertySelection
// create(path, offset[, reverse]) -> creates a collapsed PropertySelection
// create(path, startOffset, endOffset[, reverse]) -> creates an expanded PropertySelection
// create(container, startPath, startOffset, endPath, endOffset) -> creates an expanded ContainerSelection
module.exports = function createSelection(/* arguments */) {
  var container, startPath, startOffset, endPath, endOffset, start, end, reverse;
  var a = arguments;
  if (a[0] instanceof Range) {
    if (Substance.isBoolean(a[1])) {
      reverse = a[1];
    }
    return new PropertySelection(a[0], reverse);
  } else if (a[0] instanceof Coordinate) {
    if (Substance.isBoolean(a[1])) {
      reverse = a[1];
    }
    return new PropertySelection(new Range(a[0], a[0]), reverse);
  } else if (a.length < 5) {
    startPath = a[0];
    startOffset = endOffset = a[1];
    start = end = new Coordinate(startPath, startOffset);
    if (a.length > 2) {
      if (Substance.isBoolean(a[2])) {
        endOffset = startOffset;
        reverse = a[2];
      } else if (Substance.isNumber(a[2])) {
        endOffset = a[2];
        reverse = !!a[3];
        end = new Coordinate(startPath, endOffset);
      }
    }
    /* jshint eqnull:true */
    if ( startPath == null || startOffset == null || endOffset == null ) {
      throw new Error('Illegal arguments: expected (path, offset [, reverse]) or (path, startOffset, endOffset[, reverse])');
    }
    return new PropertySelection(new Range(start, end));
  } else {
    if (!Substance.isArray(arguments[1]) || !Substance.isNumber(arguments[2]) || !Substance.isArray(arguments[3]) || !Substance.isNumber(arguments[4])) {
      throw new Error('Illegal arguments: expected (startPath, startOffset, endPath, endOffset)');
    }
    container = arguments[0];
    startPath = arguments[1];
    startOffset = arguments[2];
    endPath = arguments[3];
    endOffset = arguments[4];
    reverse = !!arguments[5];
    start = new Coordinate(startPath, startOffset);
    if (Substance.isArrayEqual(startPath, endPath)) {
      // return a PropertySelection instead if the given paths are equal
      end = new Coordinate(startPath, endOffset);
    } else {
      end = new Coordinate(endPath, endOffset);
    }
    return new ContainerSelection(container, new Range(start, end));
  }
};
