'use strict';

var Substance = require('../basics');

function DocumentCoordinate(path, offset) {
  this.path = path;
  this.offset = offset;
  Object.freeze(this);
}

DocumentCoordinate.Prototype = function() {

  this.equals = function(other) {
    return (other === this ||
      (Substance.isArrayEqual(other.path, this.path) && other.offset === this.offset) );
  };

  this.withCharPos = function(offset) {
    return new DocumentCoordinate(this.path, offset);
  };

  this.getNodeId = function() {
    return this.path[0];
  };

};

Substance.initClass( DocumentCoordinate );

module.exports = DocumentCoordinate;