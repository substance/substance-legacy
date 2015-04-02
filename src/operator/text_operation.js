'use strict';

var Substance = require('../basics');
var Operation = require('./operation');
var Conflict = require('./conflict');

var INS = "+";
var DEL = "-";

function TextOperation(data) {
  if (data.type === undefined || data.pos === undefined || data.str === undefined) {
    throw new Error("Illegal argument: insufficient data.");
  }
  // '+' or '-'
  this.type = data.type;
  // the position where to apply the operation
  this.pos = data.pos;
  // the string to delete or insert
  this.str = data.str;
  // sanity checks
  if(!this.isInsert() && !this.isDelete()) {
    throw new Error("Illegal type.");
  }
  if (!Substance.isString(this.str)) {
    throw new Error("Illegal argument: expecting string.");
  }
  if (!Substance.isNumber(this.pos) && this.pos < 0) {
    throw new Error("Illegal argument: expecting positive number as pos.");
  }
}

TextOperation.fromJSON = function(data) {
  return new TextOperation(data);
};

TextOperation.Prototype = function() {

  this.apply = function(str) {
    if (this.isEmpty()) return str;
    if (this.type === INS) {
      if (str.length < this.pos) {
        throw new Error("Provided string is too short.");
      }
      if (str.splice) {
        return str.splice(this.pos, 0, this.str);
      } else {
        return str.slice(0, this.pos).concat(this.str).concat(str.slice(this.pos));
      }
    }
    else if (this.type === DEL) {
      if (str.length < this.pos + this.str.length) {
        throw new Error("Provided string is too short.");
      }
      if (str.splice) {
        return str.splice(this.pos, this.str.length);
      } else {
        return str.slice(0, this.pos).concat(str.slice(this.pos + this.str.length));
      }
    }
    else {
      throw new Error("Illegal operation type: " + this.type);
    }
  };

  this.clone = function() {
    return new TextOperation(this);
  };

  this.isNOP = function() {
    return this.type === "NOP" || this.str.length === 0;
  };

  this.isInsert = function() {
    return this.type === INS;
  };

  this.isDelete = function() {
    return this.type === DEL;
  };

  this.getLength = function() {
    return this.str.length;
  };

  this.invert = function() {
    var data = {
      type: this.isInsert() ? '-' : '+',
      pos: this.pos,
      str: this.str
    };
    return new TextOperation(data);
  };

  this.hasConflict = function(other) {
    return TextOperation.hasConflict(this, other);
  };

  this.isEmpty = function() {
    return this.str.length === 0;
  };

  this.toJSON = function() {
    return {
      type: this.type,
      pos: this.pos,
      str: this.str
    };
  };

};

Substance.inherit(TextOperation, Operation);

var hasConflict = function(a, b) {
  // Insert vs Insert:
  //
  // Insertions are conflicting iff their insert position is the same.
  if (a.type === INS && b.type === INS)  return (a.pos === b.pos);
  // Delete vs Delete:
  //
  // Deletions are conflicting if their ranges overlap.
  if (a.type === DEL && b.type === DEL) {
    // to have no conflict, either `a` should be after `b` or `b` after `a`, otherwise.
    return !(a.pos >= b.pos + b.str.length || b.pos >= a.pos + a.str.length);
  }
  // Delete vs Insert:
  //
  // A deletion and an insertion are conflicting if the insert position is within the deleted range.
  var del, ins;
  if (a.type === DEL) {
    del = a; ins = b;
  } else {
    del = b; ins = a;
  }
  return (ins.pos >= del.pos && ins.pos < del.pos + del.str.length);
};

// Transforms two Insertions
// --------

function transform_insert_insert(a, b, first) {
  if (a.pos === b.pos) {
    if (first) {
      b.pos += a.str.length;
    } else {
      a.pos += b.str.length;
    }
  }
  else if (a.pos < b.pos) {
    b.pos += a.str.length;
  }
  else {
    a.pos += b.str.length;
  }
}

// Transform two Deletions
// --------
//

function transform_delete_delete(a, b, first) {
  // reduce to a normalized case
  if (a.pos > b.pos) {
    return transform_delete_delete(b, a, !first);
  }
  if (a.pos === b.pos && a.str.length > b.str.length) {
    return transform_delete_delete(b, a, !first);
  }
  // take out overlapping parts
  if (b.pos < a.pos + a.str.length) {
    var s = b.pos - a.pos;
    var s1 = a.str.length - s;
    var s2 = s + b.str.length;
    a.str = a.str.slice(0, s) + a.str.slice(s2);
    b.str = b.str.slice(s1);
    b.pos -= s;
  } else {
    b.pos -= a.str.length;
  }
}

// Transform Insert and Deletion
// --------
//

function transform_insert_delete(a, b) {
  if (a.type === DEL) {
    return transform_insert_delete(b, a);
  }
  // we can assume, that a is an insertion and b is a deletion
  // a is before b
  if (a.pos <= b.pos) {
    b.pos += a.str.length;
  }
  // a is after b
  else if (a.pos >= b.pos + b.str.length) {
    a.pos -= b.str.length;
  }
  // Note: this is a conflict case the user should be noticed about
  // If applied still, the deletion takes precedence
  // a.pos > b.pos && <= b.pos + b.length
  else {
    var s = a.pos - b.pos;
    b.str = b.str.slice(0, s) + a.str + b.str.slice(s);
    a.str = "";
  }
}

var transform = function(a, b, options) {
  options = options || {};
  if (options.check && hasConflict(a, b)) {
    throw new Conflict(a, b);
  }
  if (!options.inplace) {
    a = Substance.clone(a);
    b = Substance.clone(b);
  }
  if (a.type === INS && b.type === INS)  {
    transform_insert_insert(a, b, true);
  }
  else if (a.type === DEL && b.type === DEL) {
    transform_delete_delete(a, b, true);
  }
  else {
    transform_insert_delete(a,b);
  }
  return [a, b];
};

TextOperation.transform = function() {
  return transform.apply(null, arguments);
};

/* Factories */

TextOperation.Insert = function(pos, str) {
  return new TextOperation({ type: INS, pos: pos, str: str });
};

TextOperation.Delete = function(pos, str) {
  return new TextOperation({ type: DEL, pos: pos, str: str });
};

// A helper class to model Text selections and to provide an easy way
// to bookkeep changes by other applied TextOperations
var Range = function(range) {
  if (Substance.isArray(range)) {
    this.start = range[0];
    this.length = range[1];
  } else {
    this.start = range.start;
    this.length = range.length;
  }
};

// Transforms a given range tuple (offset, length) in-place.
// --------
//

var range_transform = function(range, textOp, expandLeft, expandRight) {
  var changed = false;
  var start, end;

  if (Substance.isArray(range)) {
    start = range[0];
    end = range[1];
  } else {
    start = range.start;
    end = start + range.length;
  }
  // Delete
  if (textOp.type === DEL) {
    var pos1 = textOp.pos;
    var pos2 = textOp.pos+textOp.str.length;
    if (pos1 <= start) {
      start -= Math.min(pos2-pos1, start-pos1);
      changed = true;
    }
    if (pos1 <= end) {
      end -= Math.min(pos2-pos1, end-pos1);
      changed = true;
    }
  } else if (textOp.type === INS) {
    var pos = textOp.pos;
    var l = textOp.str.length;
    if ( (pos < start) ||
         (pos === start && !expandLeft) ) {
      start += l;
      changed = true;
    }
    if ( (pos < end) ||
         (pos === end && expandRight) ) {
      end += l;
      changed = true;
    }
  }
  if (changed) {
    if (Substance.isArray(range)) {
      range[0] = start;
      range[1] = end;
    } else {
      range.start = start;
      range.length = end - start;
    }
  }
  return changed;
};

Range.Prototype = function() {

  this.clone = function() {
    return new Range(this);
  };

  this.toJSON = function() {
    var result = {
      start: this.start,
      length: this.length
    };
    // if (this.expand) result.expand = true;
    return result;
  };

  this.transform = function(textOp, expand) {
    return range_transform(this.range, textOp, expand);
  };

};
Range.prototype = new Range.Prototype();

Range.transform = function(range, op, expandLeft, expandRight) {
  return range_transform(range, op, expandLeft, expandRight);
};

Range.fromJSON = function(data) {
  return new Range(data);
};

TextOperation.Range = Range;
TextOperation.INSERT = INS;
TextOperation.DELETE = DEL;

module.exports = TextOperation;
