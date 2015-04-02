'use strict';

var Substance = require('../basics');
var PathAdapter = Substance.PathAdapter;

var TextOperation = require('./text_operation');
var ArrayOperation = require('./array_operation');

var Conflict = require('./conflict');

var NOP = "NOP";
var CREATE = "create";
var DELETE = 'delete';
var UPDATE = 'update';
var SET = 'set';

var ObjectOperation = function(data) {
  this.type = data.type;
  this.path = data.path;

  if (this.type === CREATE || this.type === DELETE) {
    this.val = data.val;
  }
  // Updates can be given as value or as Operation (Text, Array)
  else if (this.type === UPDATE) {
    if (data.diff !== undefined) {
      this.diff = data.diff;
      this.propertyType = data.propertyType;
    } else {
      throw new Error("Illegal argument: update by value or by diff must be provided");
    }
  }
  else if (this.type === SET) {
    this.val = data.val;
    this.original = data.original;
  }
  this.data = data.data;
};

ObjectOperation.fromJSON = function(data) {
  var op = new ObjectOperation(data);
  if (data.type === "update") {
    switch (data.propertyType) {
    case "string":
      op.diff = TextOperation.fromJSON(op.diff);
      break;
    case "array":
      op.diff = ArrayOperation.fromJSON(op.diff);
      break;
    default:
      throw new Error("Don't know how to deserialize this operation:" + JSON.stringify(data));
    }
  }
  return op;
};

ObjectOperation.Prototype = function() {

  this.apply = function(obj) {
    if (this.type === NOP) return obj;
    var adapter;
    if (obj instanceof PathAdapter) {
      adapter = obj;
    } else {
      adapter = new PathAdapter(obj);
    }
    if (this.type === CREATE) {
      adapter.set(this.path, Substance.clone(this.val));
      return obj;
    }
    if (this.type === DELETE) {
      adapter.delete(this.path, "strict");
    }
    else if (this.type === UPDATE) {
      var diff = this.diff;
      var oldVal = adapter.get(this.path);
      var newVal;
      if (this.propertyType === 'array') {
        if (! (diff instanceof ArrayOperation) ) {
          diff = ArrayOperation.fromJSON(diff);
        }
        newVal = diff.apply(oldVal);
      }
      else if (this.propertyType === 'string') {
        if (! (diff instanceof TextOperation) ) {
          diff = TextOperation.fromJSON(diff);
        }
        newVal = diff.apply(oldVal);
      }
      else {
        throw new Error("Unsupported type for operational update.");
      }
      adapter.set(this.path, newVal);
    }
    else if (this.type === SET) {
      // clone here as the operations value must not be changed
      adapter.set(this.path, Substance.clone(this.val));
    }
    else {
      throw new Error("Illegal state.");
    }
    return obj;
  };

  this.clone = function() {
    return new ObjectOperation(this);
  };

  this.isNOP = function() {
    if (this.type === NOP) return true;
    else if (this.type === UPDATE) return this.diff.isNOP();
  };

  this.invert = function() {

    if (this.type === NOP) {
      return { type: NOP };
    }

    var result = new ObjectOperation(this);

    if (this.type === CREATE) {
      result.type = DELETE;
    }

    else if (this.type === DELETE) {
      result.type = CREATE;
    }

    else if (this.type === UPDATE) {
      var invertedDiff;
      if (this.propertyType === 'string') {
        invertedDiff = TextOperation.fromJSON(this.diff).invert();
      }
      else if (this.propertyType === 'array') {
        invertedDiff = ArrayOperation.fromJSON(this.diff).invert();
      }
      result.diff = invertedDiff;
      result.propertyType = this.propertyType;
    }

    else if (this.type === SET) {
      result.val = this.original;
      result.original = this.val;
    }

    else {
      throw new Error("Illegal state.");
    }

    return result;
  };

  this.hasConflict = function(other) {
    return ObjectOperation.hasConflict(this, other);
  };

  this.toJSON = function() {

    if (this.type === NOP) {
      return { type: NOP };
    }

    var data = {
      type: this.type,
      path: this.path,
      data: this.data
    };

    if (this.type === CREATE || this.type === DELETE) {
      data.val = this.val;
    }

    else if (this.type === UPDATE) {
      data.diff = this.diff;
      if (this.diff instanceof ObjectOperation) {
        data.propertyType = "object";
      } else if (this.diff instanceof ArrayOperation) {
        data.propertyType = "array";
      } else if (this.diff instanceof TextOperation) {
        data.propertyType = "string";
      }
    }

    else if (this.type === SET) {
      data.val = this.val;
      data.original = this.original;
    }

    return data;
  };

};

Substance.initClass(ObjectOperation);

/* Low level implementation */

var hasConflict = function(a, b) {
  if (a.type === NOP || b.type === NOP) return false;

  return Substance.isEqual(a.path, b.path);
};

var transform_delete_delete = function(a, b) {
  // both operations have the same effect.
  // the transformed operations are turned into NOPs
  a.type = NOP;
  b.type = NOP;
};

var transform_create_create = function() {
  // TODO: maybe it would be possible to create an differntial update that transforms the one into the other
  // However, we fail for now.
  throw new Error("Can not transform two concurring creates of the same property");
};

var transform_delete_create = function(a, b, flipped) {
  if (a.type !== DELETE) {
    return transform_delete_create(b, a, true);
  }

  if (!flipped) {
    a.type = NOP;
  } else {
    a.val = b.val;
    b.type = NOP;
  }
};

var transform_delete_update = function(a, b, flipped) {
  if (a.type !== DELETE) {
    return transform_delete_update(b, a, true);
  }

  var op;
  if (b.propertyType === 'string') {
    op = TextOperation.fromJSON(b.diff);
  } else if (b.propertyType === 'array') {
    op = ArrayOperation.fromJSON(b.diff);
  }

  // (DELETE, UPDATE) is transformed into (DELETE, CREATE)
  if (!flipped) {
    a.type = NOP;
    b.type = CREATE;
    b.val = op.apply(a.val);
  }
  // (UPDATE, DELETE): the delete is updated to delete the updated value
  else {
    a.val = op.apply(a.val);
    b.type = NOP;
  }

};

var transform_create_update = function() {
  // it is not possible to reasonably transform this.
  throw new Error("Can not transform a concurring create and update of the same property");
};

var transform_update_update = function(a, b) {

  // Note: this is a conflict the user should know about

  var op_a, op_b, t;
  if (b.propertyType === 'string') {
    op_a = TextOperation.fromJSON(a.diff);
    op_b = TextOperation.fromJSON(b.diff);
    t = TextOperation.transform(op_a, op_b, {inplace: true});
  } else if (b.propertyType === 'array') {
    op_a = ArrayOperation.fromJSON(a.diff);
    op_b = ArrayOperation.fromJSON(b.diff);
    t = ArrayOperation.transform(op_a, op_b, {inplace: true});
  } else if (b.propertyType === 'object') {
    op_a = ObjectOperation.fromJSON(a.diff);
    op_b = ObjectOperation.fromJSON(b.diff);
    t = ObjectOperation.transform(op_a, op_b, {inplace: true});
  }

  a.diff = t[0];
  b.diff = t[1];
};

var transform_create_set = function(a, b, flipped) {
  if (a.type !== CREATE) return transform_create_set(b, a, true);

  if (!flipped) {
    a.type = NOP;
    b.original = a.val;
  } else {
    a.type = SET;
    a.original = b.val;
    b.type = NOP;
  }

};

var transform_delete_set = function(a, b, flipped) {
  if (a.type !== DELETE) return transform_delete_set(b, a, true);

  if (!flipped) {
    a.type = NOP;
    b.type = CREATE;
    b.original = undefined;
  } else {
    a.val = b.val;
    b.type = NOP;
  }

};

var transform_update_set = function() {
  throw new Error("Can not transform update/set of the same property.");
};

var transform_set_set = function(a, b) {
  a.type = NOP;
  b.original = a.val;
};

var _NOP = 0;
var _CREATE = 1;
var _DELETE = 2;
var _UPDATE = 4;
var _SET = 8;

var CODE = {};
CODE[NOP] =_NOP;
CODE[CREATE] = _CREATE;
CODE[DELETE] = _DELETE;
CODE[UPDATE] = _UPDATE;
CODE[SET] = _SET;

var __transform__ = [];
__transform__[_DELETE | _DELETE] = transform_delete_delete;
__transform__[_DELETE | _CREATE] = transform_delete_create;
__transform__[_DELETE | _UPDATE] = transform_delete_update;
__transform__[_CREATE | _CREATE] = transform_create_create;
__transform__[_CREATE | _UPDATE] = transform_create_update;
__transform__[_UPDATE | _UPDATE] = transform_update_update;
__transform__[_CREATE | _SET   ] = transform_create_set;
__transform__[_DELETE | _SET   ] = transform_delete_set;
__transform__[_UPDATE | _SET   ] = transform_update_set;
__transform__[_SET    | _SET   ] = transform_set_set;

var transform = function(a, b, options) {

  options = options || {};

  var conflict = hasConflict(a, b);

  if (options.check && conflict) {
    throw new Conflict(a, b);
  }

  if (!options.inplace) {
    a = Substance.clone(a);
    b = Substance.clone(b);
  }

  // without conflict: a' = a, b' = b
  if (!conflict) {
    return [a, b];
  }

  __transform__[CODE[a.type] | CODE[b.type]](a,b);

  return [a, b];
};

ObjectOperation.transform = transform;
ObjectOperation.hasConflict = hasConflict;

/* Factories */

ObjectOperation.Create = function(idOrPath, val) {
  var path;
  if (Substance.isString(idOrPath)) {
    path = [idOrPath];
  } else if (Substance.isArray(idOrPath)) {
    path = idOrPath;
  } else {
    throw new Error('Illegal argument');
  }
  return new ObjectOperation({type: CREATE, path: path, val: val});
};

ObjectOperation.Delete = function(idOrPath, val) {
  var path;
  if (Substance.isString(idOrPath)) {
    path = [idOrPath];
  } else if (Substance.isArray(idOrPath)) {
    path = idOrPath;
  } else {
    throw new Error('Illegal argument');
  }
  return new ObjectOperation({type: DELETE, path: path, val: val});
};

ObjectOperation.Update = function(path, op) {
  var propertyType;
  if (op instanceof TextOperation) {
    propertyType = "string";
  }
  else if (op instanceof ArrayOperation) {
    propertyType = "array";
  }
  else if (op instanceof ObjectOperation) {
    propertyType = "object";
  }
  else {
    throw new Error('Unsupported type for operational changes');
  }
  return new ObjectOperation({
    type: UPDATE,
    path: path,
    diff: op,
    propertyType: propertyType
  });
};

ObjectOperation.Set = function(path, oldVal, newVal) {
  return new ObjectOperation({
    type: SET,
    path: path,
    val: Substance.clone(newVal),
    original: Substance.clone(oldVal)
  });
};

ObjectOperation.NOP = NOP;
ObjectOperation.CREATE = CREATE;
ObjectOperation.DELETE = DELETE;
ObjectOperation.UPDATE = UPDATE;
ObjectOperation.SET = SET;

module.exports = ObjectOperation;
