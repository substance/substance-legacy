'use strict';

var Substance = require('../basics');
var PropertySelection = require('./property_selection');
var Selection = require('./selection');
var Container = require('./container');

function ContainerSelection(container, range, reverse) {
  if (!(container instanceof Container)) {
    throw new Error('Illegal argument: expected Container instance.');
  }
  // Note: not calling the super ctor as it freezes the instance
  this.container = container;
  this.range = range;
  this.reverse = reverse;
  this.collapsed = range.start.equals(range.end);
  this._internal = {};
  Object.freeze(this);
}

ContainerSelection.Prototype = function() {

  this.isPropertySelection = function() {
    return false;
  };

  this.isContainerSelection = function() {
    return true;
  };

  this.toString = function() {
    return "ContainerSelection("+ JSON.stringify(this.range.start.path) + ":" + this.range.start.offset + " -> " +  JSON.stringify(this.range.end.path) + ":" + this.range.end.offset + (this.reverse ? ", reverse" : "") + ")";
  };

  this.expand = function(other) {
    var c1 = _coordinates(this.container, this);
    var c2 = _coordinates(this.container, other);
    var c1s = c1.start;
    var c2s = c2.start;
    var c1e = c1.end;
    var c2e = c2.end;
    var newCoors = {
      start: { pos: c1s.pos, offset: c1s.offset },
      end: { pos: c1e.pos, offset: c1e.offset }
    };
    if (c1s.pos > c2s.pos) {
      newCoors.start.pos = c2s.pos;
      newCoors.start.offset = c2s.offset;
    } else if (c1s.pos === c2s.pos) {
      newCoors.start.offset = Math.min(c1s.offset, c2s.offset);
    }
    if (c1e.pos < c2e.pos) {
      newCoors.end.pos = c2e.pos;
      newCoors.end.offset = c2e.offset;
    } else if (c1e.pos === c2e.pos) {
      newCoors.end.offset = Math.max(c1e.offset, c2e.offset);
    }
    return _createNewSelection(this.container, newCoors);
  };

  // There should be exactly one
  this.truncate = function(other) {
    var c1 = _coordinates(this.container, this);
    var c2 = _coordinates(this.container, other);
    var newCoors = {};
    if (_isBefore(c2.start, c1.start, 'strict')) {
      newCoors.start = c1.start;
      newCoors.end = c2.end;
    } else if (_isBefore(c1.end, c2.end, 'strict')) {
      newCoors.start = c2.start;
      newCoors.end = c1.end;
    } else if (_isEqual(c1.start, c2.start)) {
      if (_isEqual(c1.end, c2.end)) {
        return Selection.nullSelection;
      } else {
        newCoors.start = c2.end;
        newCoors.end = c1.end;
      }
    } else if (_isEqual(c1.end, c2.end)) {
      newCoors.start = c1.start;
      newCoors.end = c2.start;
    }
    return _createNewSelection(this.container, newCoors);
  };

  this.isInside = function(other, strict) {
    if (other.isNull()) return false;
    var c1 = _coordinates(this.container, this);
    var c2 = _coordinates(this.container, other);
    return (_isBefore(c2.start, c1.start, strict) && _isBefore(c1.end, c2.end, strict));
  };

  this.includes = function(other) {
    var c1 = _coordinates(this.container, this);
    var c2 = _coordinates(this.container, other);
    return (_isBefore(c1.start, c2.start) && _isBefore(c2.end, c1.end));
  };

  // includes and at least one boundary
  this.includesWithOneBoundary = function(other) {
    var c1 = _coordinates(this.container, this);
    var c2 = _coordinates(this.container, other);
    return (
      (_isEqual(c1.start, c2.start) && _isBefore(c2.end, c1.end)) ||
      (_isEqual(c1.end, c2.end) && _isBefore(c1.start, c2.start))
    );
  };

  this.overlaps = function(other) {
    var c1 = _coordinates(this.container, this);
    var c2 = _coordinates(this.container, other);
    // it overlaps if they are not disjunct
    return !(_isBefore(c1.end, c2.start) || _isBefore(c2.end, c1.start));
  };

  this.isLeftAligned = function(other) {
    var c1 = _coordinates(this.container, this);
    var c2 = _coordinates(this.container, other);
    return _isEqual(c1.start, c2.start);
  };

  this.isRightAligned = function(other) {
    var c1 = _coordinates(this.container, this);
    var c2 = _coordinates(this.container, other);
    return _isEqual(c1.end, c2.end);
  };


  var _coordinates = function(container, sel) {
    if (sel._internal.coor) {
      return sel._internal.coor;
    }
    var range = sel.getRange();
    var startPos = container.getComponent(range.start.path).getIndex();
    var endPos;
    if (sel.isCollapsed()) {
      endPos = startPos;
    } else {
      endPos = container.getComponent(range.end.path).getIndex();
    }
    var result = {
      start: {
        pos: startPos,
        offset: range.start.offset,
      },
      end: {
        pos: endPos,
        offset: range.end.offset
      },
      collapsed: sel.isCollapsed()
    };
    sel._internal.coor = result;
    return result;
  };

  var _isBefore = function(c1, c2, strict) {
    if (strict) {
      if (c1.pos >= c2.pos) return false;
      if (c1.pos == c2.pos && c1.offset >= c2.offset) return false;
      return true;
    } else {
      if (c1.pos > c2.pos) return false;
      if (c1.pos == c2.pos && c1.offset > c2.offset) return false;
      return true;
    }
  };

  var _isEqual = function(c1, c2) {
    return (c1.pos === c2.pos && c1.offset === c2.offset);
  };

  var _createNewSelection = function(container, newCoors) {
    newCoors.start.path = container.getComponentAt(newCoors.start.pos).path;
    newCoors.end.path = container.getComponentAt(newCoors.end.pos).path;
    return Selection.create(container,
      newCoors.start.path, newCoors.start.offset,
      newCoors.end.path, newCoors.end.offset);
  };
};

Substance.inherit(ContainerSelection, PropertySelection);

Object.defineProperties(ContainerSelection.prototype, {
  path: {
    get: function() {
      throw new Error('ContainerSelection has not path property. Use startPath and endPath instead');
    },
    set: function() { throw new Error('immutable.'); }
  },
  startPath: {
    get: function() {
      return this.range.start.path;
    },
    set: function() { throw new Error('immutable.'); }
  },
  endPath: {
    get: function() {
      return this.range.end.path;
    },
    set: function() { throw new Error('immutable.'); }
  }
});

module.exports = ContainerSelection;
