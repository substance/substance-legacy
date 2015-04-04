'use strict';

var Substance = require('../basics');

function Selection() {
}

Selection.Prototype = function() {

  this.getRanges = function() {
    return [];
  };

  this.isNull = function() {
    return true;
  };

  this.isMultiSeletion = function() {
    return false;
  };

  this.isPropertySelection = function() {
    return false;
  };

  this.isContainerSelection = function() {
    return false;
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
    var coor;
    if (direction === 'left') {
      coor = this.range.start;
    } else {
      coor = this.range.end;
    }
    return Selection.create(coor);
  };

};

Substance.initClass(Selection);

Selection.NullSelection = Object.freeze(new Selection());

// this is set in index as it has dependencies to sub-classes
// which can't be required here to avoid cyclic dep.
Selection.create = null;

module.exports = Selection;
