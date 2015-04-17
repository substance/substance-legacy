'use strict';

var Substance = require('../basics');
var Operation = require('./operation');
var Conflict = require('./conflict');

var NOP = "NOP";
var DEL = "delete";
var INS = "insert";

var ArrayOperation = function(options) {

  if (options.type === undefined) {
    throw new Error("Illegal argument: insufficient data.");
  }

  // Insert: '+', Delete: '-', Move: '>>'
  this.type = options.type;

  if (this.type === NOP) return;

  // the position where to apply the operation
  this.pos = options.pos;

  // the string to delete or insert
  this.val = options.val;

  // sanity checks
  if(this.type !== NOP && this.type !== INS && this.type !== DEL) {
    throw new Error("Illegal type.");
  }

  if (this.type === INS || this.type === DEL) {
    if (this.pos === undefined || this.val === undefined) {
      throw new Error("Illegal argument: insufficient data.");
    }
    if (!Substance.isNumber(this.pos) && this.pos < 0) {
      throw new Error("Illegal argument: expecting positive number as pos.");
    }
  }
};

ArrayOperation.fromJSON = function(data) {
  return new ArrayOperation(data);
};

ArrayOperation.Prototype = function() {

  this.apply = function(array) {
    if (this.type === NOP) {
      return array;
    }
    if (this.type === INS) {
      if (array.length < this.pos) {
        throw new Error("Provided array is too small.");
      }
      array.splice(this.pos, 0, this.val);
      return array;
    }
    // Delete
    else if (this.type === DEL) {
      if (array.length < this.pos) {
        throw new Error("Provided array is too small.");
      }
      if (!Substance.isEqual(array[this.pos], this.val)) {
        throw Error("Unexpected value at position " + this.pos + ". Expected " + this.val + ", found " + array[this.pos]);
      }
      array.splice(this.pos, 1);
      return array;
    }
    else {
      throw new Error("Illegal state.");
    }
  };

  this.clone = function() {
    return new ArrayOperation(this);
  };

  this.invert = function() {
    var data = this.toJSON();
    if (this.type === INS) data.type = DEL;
    else if (this.type === DEL) data.type = INS;
    else if (this.type === NOP) data.type = NOP;
    else {
      throw new Error("Illegal state.");
    }
    return new ArrayOperation(data);
  };

  this.hasConflict = function(other) {
    return ArrayOperation.hasConflict(this, other);
  };

  this.toJSON = function() {
    var result = {
      type: this.type,
    };
    if (this.type === NOP) return result;
    result.pos = this.pos;
    result.val = this.val;
    return result;
  };

  this.isInsert = function() {
    return this.type === INS;
  };

  this.isDelete = function() {
    return this.type === DEL;
  };

  this.getOffset = function() {
    return this.pos;
  };

  this.getValue = function() {
    return this.val;
  };

  this.isNOP = function() {
    return this.type === NOP;
  };
};

Substance.inherit(ArrayOperation, Operation);

var _NOP = 0;
var _DEL = 1;
var _INS = 2;

var CODE = {};
CODE[NOP] = _NOP;
CODE[DEL] = _DEL;
CODE[INS] = _INS;

var _hasConflict = [];

_hasConflict[_DEL | _DEL] = function(a,b) {
  return a.pos === b.pos;
};

_hasConflict[_DEL | _INS] = function() {
  return false;
};

_hasConflict[_INS | _INS] = function(a,b) {
  return a.pos === b.pos;
};

/*
  As we provide Move as quasi atomic operation we have to look at it conflict potential.

  A move is realized as composite of Delete and Insert.

  M / I: ( -> I / I conflict)

    m.s < i && m.t == i-1
    else i && m.t == i

  M / D: ( -> D / D conflict)

    m.s === d

  M / M:

    1. M/D conflict
    2. M/I conflict
*/

var hasConflict = function(a, b) {
  if (a.type === NOP || b.type === NOP) return false;
  var caseId = CODE[a.type] | CODE[b.type];
  if (_hasConflict[caseId]) {
    return _hasConflict[caseId](a,b);
  } else {
    return false;
  }
};

var transform0;

function transform_insert_insert(a, b, first) {

  if (a.pos === b.pos) {
    if (first) {
      b.pos += 1;
    } else {
      a.pos += 1;
    }
  }
  // a before b
  else if (a.pos < b.pos) {
    b.pos += 1;
  }

  // a after b
  else  {
    a.pos += 1;
  }

}

function transform_delete_delete(a, b) {

  // turn the second of two concurrent deletes into a NOP
  if (a.pos === b.pos) {
    b.type = NOP;
    a.type = NOP;
    return;
  }

  if (a.pos < b.pos) {
    b.pos -= 1;
  } else {
    a.pos -= 1;
  }

}

function transform_insert_delete(a, b) {

  // reduce to a normalized case
  if (a.type === DEL) {
    var tmp = a;
    a = b;
    b = tmp;
  }

  if (a.pos <= b.pos) {
    b.pos += 1;
  } else {
    a.pos -= 1;
  }

}

transform0 = function(a, b, options) {

  options = options || {};

  if (options.check && hasConflict(a, b)) {
    throw new Conflict(a, b);
  }

  if (!options.inplace) {
    a = Substance.clone(a);
    b = Substance.clone(b);
  }

  if (a.type === NOP || b.type === NOP)  {
    // nothing to transform
  }
  else if (a.type === INS && b.type === INS)  {
    transform_insert_insert(a, b, true);
  }
  else if (a.type === DEL && b.type === DEL) {
    transform_delete_delete(a, b, true);
  }
  else {
    transform_insert_delete(a, b, true);
  }

  return [a, b];
};

ArrayOperation.transform = transform0;
ArrayOperation.hasConflict = hasConflict;

/* Factories */

ArrayOperation.Insert = function(pos, val) {
  return new ArrayOperation({type:INS, pos: pos, val: val});
};

ArrayOperation.Delete = function(pos, val) {
  return new ArrayOperation({ type:DEL, pos: pos, val: val });
};

ArrayOperation.NOP = NOP;
ArrayOperation.DELETE = DEL;
ArrayOperation.INSERT = INS;

// Export
// ========

module.exports = ArrayOperation;
