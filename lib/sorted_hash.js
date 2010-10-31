var root = this;

// Unveil.js
// =============================================================================

var uv = {};

// Constants
// -----------------------------------------------------------------------------

uv.EPSILON     = 0.0001;
uv.MAX_FLOAT   = 3.4028235e+38;
uv.MIN_FLOAT   = -3.4028235e+38;
uv.MAX_INT     = 2147483647;
uv.MIN_INT     = -2147483648;

// Utilities
// -----------------------------------------------------------------------------

uv.inherit = function (f) {
  function G() {}
  G.prototype = f.prototype || f;
  return new G();
};

uv.each = function(obj, iterator, context) {
  if (obj.forEach) {
    obj.forEach(iterator, context);
  } else {
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) iterator.call(context, obj[key], key, obj);
    }
  }
  return obj;
};

uv.rest = function(array, index, guard) {
  return Array.prototype.slice.call(array, (index === undefined || guard) ? 1 : index);
};

uv.include = function(arr, target) {
  return arr.indexOf(target) != -1;
};

uv.select = uv.filter = function(obj, iterator, context) {
  if (obj.filter === Array.prototype.filter)
    return obj.filter(iterator, context);
  var results = [];
  uv.each(obj, function(value, index, list) {
    iterator.call(context, value, index, list) && results.push(value);
  });
  return results;
};

uv.extend = function(obj) {
  uv.rest(arguments).forEach(function(source) {
    for (var prop in source) obj[prop] = source[prop];
  });
  return obj;
};

// SortedHash
// =============================================================================

// Constructor
// Initializes a Sorted Hash
uv.SortedHash = function (data) {
  var that = this;
  this.data = {};
  this.keyOrder = [];
  this.length = 0;
  
  if (data instanceof Array) {
    uv.each(data, function(datum, index) {
      that.set(index, datum);
    });
  } else if (data instanceof Object) {
    uv.each(data, function(datum, key) {
      that.set(key, datum);
    });
  }
};


// Returns a copy of the sorted hash
// Used by transformation methods
uv.SortedHash.prototype.clone = function () {
  var copy = new uv.SortedHash();
  copy.length = this.length;
  uv.each(this.data, function(value, key) {
    copy.data[key] = value;
  });
  copy.keyOrder = this.keyOrder.slice(0, this.keyOrder.length);
  return copy;
};

// Set a value at a given key
// Parameters:
//   * key [String]
uv.SortedHash.prototype.set = function (key, value, targetIndex) {
  if (key === undefined)
    return this;
    
  if (!this.data[key]) {
    if (targetIndex) { // insert at a given index
      var front = this.select(function(item, key, index) {
        return index < targetIndex;
      });
      
      var back = this.select(function(item, key, index) {
        return index >= targetIndex;
      });
      
      this.keyOrder = [].concat(front.keyOrder);
      this.keyOrder.push(key);
      this.keyOrder = this.keyOrder.concat(back.keyOrder);
    } else {
      this.keyOrder.push(key);
    }
    this.length += 1;
  }
  
  this.data[key] = value;
  return this;
};


// Remove entry at given key
// Parameters:
//   * key [String]
uv.SortedHash.prototype.del = function (key) {
  delete this.data[key];
  this.keyOrder.splice(this.index(key), 1);
  this.length -= 1;
  return this;
};

// Get value at given key
// Parameters:
//   * key [String]
uv.SortedHash.prototype.get = function (key) {
  return this.data[key];
};

// Get value at given index
// Parameters:
//   * index [Number]
uv.SortedHash.prototype.at = function (index) {
  var key = this.keyOrder[index];
  return this.data[key];
};

// Get first item
uv.SortedHash.prototype.first = function () {
  return this.at(0);
};

// Get last item
uv.SortedHash.prototype.last = function () {
  return this.at(this.length-1);
};

// Returns for an index the corresponding key
// Parameters:
//   * index [Number]
uv.SortedHash.prototype.key = function (index) {
  return this.keyOrder[index];
};

// Returns for a given key the corresponding index
uv.SortedHash.prototype.index = function(key) {
  return this.keyOrder.indexOf(key);
};

// Iterate over values contained in the SortedHash
// Parameters:
//   * [Function] 
uv.SortedHash.prototype.each = function (f) {
  var that = this;
  uv.each(this.keyOrder, function(key, index) {
    f.call(that, that.data[key], key, index);
  });
  return this;
};

// Convert to an ordinary JavaScript Array containing
// the values
// 
// Returns:
//   * Array of items
uv.SortedHash.prototype.values = function () {
  var result = [];
  this.each(function(value, key, index) {
    result.push(value);
  });
  return result;
};


// Returns all keys in current order
uv.SortedHash.prototype.keys = function () {
  return this.keyOrder;
};



// Convert to an ordinary JavaScript Array containing
// key value pairs — used for sorting
// 
// Returns:
//   * Array of key value pairs
uv.SortedHash.prototype.toArray = function () {
  var result = [];
  
  this.each(function(value, key) {
    result.push({key: key, value: value});
  });
  
  return result;
};


// Map the SortedHash to your needs
// Parameters:
//   * [Function] 
uv.SortedHash.prototype.map = function (f) {
  var result = this.clone(),
      that = this;
  result.each(function(item, key, index) {
    result.data[that.key(index)] = f.call(result, item);
  });
  return result;
};

// Select items that match some conditions expressed by a matcher function
// Parameters:
//   * [Function] matcher function
uv.SortedHash.prototype.select = function (f) {
  var result = new uv.SortedHash(),
      that = this;
  
  this.each(function(value, key, index) {
    if (f.call(that, value, key, index)) {
      result.set(key, value);
    }
  });
  return result;
};


// Performs a sort on the SortedHash
// Parameters:
//   * comparator [Function] A comparator function
// Returns:
//   * The now re-sorted SortedHash (for chaining)
uv.SortedHash.prototype.sort = function (comparator) {
  var result = this.clone();
      sortedKeys = result.toArray().sort(comparator);

  // update keyOrder
  result.keyOrder = $.map(sortedKeys, function(k) {
    return k.key;
  });
  
  return result;
};


// Performs an intersection with the given SortedHash
// Parameters:
//   * sortedHash [SortedHash]
uv.SortedHash.prototype.intersect = function(sortedHash) {
  var that = this,
  result = new uv.SortedHash();
  
  this.each(function(value, key) {
    sortedHash.each(function(value2, key2) {
      if (key === key2) {
        result.set(key, value);
      }
    });
  });
  return result;
};

// Performs an union with the given SortedHash
// Parameters:
//   * sortedHash [SortedHash]
uv.SortedHash.prototype.union = function(sortedHash) {
  var that = this,
  result = new uv.SortedHash();
  
  this.each(function(value, key) {
    if (!result.get(key))
      result.set(key, value);
  });
  sortedHash.each(function(value, key) {
    if (!result.get(key))
      result.set(key, value);
  });
  return result;
};

// Aggregators
//-----------------------------------------------------------------------------

uv.Aggregators = {};

uv.Aggregators.SUM = function (values) {
  var result = 0;
  
  values.each(function(value, key, index) {
    result += value;
  });

  return result;
};

uv.Aggregators.MIN = function (values) {
  var result = Infinity;
  values.each(function(value, key, index) {
    if (value < result) {
      result = value;
    }
  });
  return result;
};

uv.Aggregators.MAX = function (values) {
  var result = -Infinity;
  values.each(function(value, key, index) {
    if (value > result) {
      result = value;
    }
  });
  return result;
};

uv.Aggregators.AVG = function (values) {
  return uv.Aggregators.SUM(values) / values.length;
};

uv.Aggregators.COUNT = function (values) {
  return values.length;
};


// Comparators
//-----------------------------------------------------------------------------

uv.Comparators = {};

uv.Comparators.ASC = function(item1, item2) {
  return item1.value === item2.value ? 0 : (item1.value < item2.value ? -1 : 1);
};

uv.Comparators.DESC = function(item1, item2) {
  return item1.value === item2.value ? 0 : (item1.value > item2.value ? -1 : 1);
};

