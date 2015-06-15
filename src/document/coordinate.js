'use strict';

var Substance = require('../basics');

// path: the address of a property, such as ['text_1', 'content']
// offset: the position in the property
// after: an internal flag indicating if the address should be associated to the left or right side
//   Note: at boundaries of annotations there are two possible positions with the same address
//       foo <strong>bar</strong> ...
//     With offset=7 normally we associate this position:
//       foo <strong>bar|</strong> ...
//     With after=true we can describe this position:
//       foo <strong>bar</strong>| ...
function Coordinate(path, offset, after) {
  this.path = path;
  this.offset = offset;
  this.after = after;
  Object.freeze(path);
  Object.freeze(this);
}

Coordinate.Prototype = function() {

  this.equals = function(other) {
    return (other === this ||
      (Substance.isArrayEqual(other.path, this.path) && other.offset === this.offset) );
  };

  this.withCharPos = function(offset) {
    return new Coordinate(this.path, offset);
  };

  this.getNodeId = function() {
    return this.path[0];
  };

  this.getPath = function() {
    return this.path;
  };

  this.getOffset = function() {
    return this.offset;
  };

};

Substance.initClass( Coordinate );

module.exports = Coordinate;