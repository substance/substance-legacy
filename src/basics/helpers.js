'use strict';

var Substance = {};

// Lang helpers
Substance.isEqual = require('lodash/lang/isEqual');
Substance.isObject = require('lodash/lang/isObject');
Substance.isArray = require('lodash/lang/isArray');
Substance.isString = require('lodash/lang/isString');
Substance.isNumber = require('lodash/lang/isNumber');
Substance.isBoolean = require('lodash/lang/isBoolean');
Substance.isFunction = require('lodash/lang/isFunction');
Substance.cloneDeep = require('lodash/lang/cloneDeep');

// Function helpers
Substance.bind = require('lodash/function/bind');
Substance.delay = require('lodash/function/delay');
Substance.debounce = require('lodash/function/debounce');

// Object helpers
Substance.extend = require('lodash/object/extend');

// Array helpers
Substance.last = require('lodash/array/last');
Substance.first = require('lodash/array/first');
Substance.compact = require('lodash/array/compact');
Substance.uniq = require('lodash/array/uniq');
Substance.intersection = require('lodash/array/intersection');
Substance.union = require('lodash/array/union');
Substance.without = require('lodash/array/without');

// Collection helpers
Substance.each = require('lodash/collection/forEach');
Substance.filter = require('lodash/collection/filter');
Substance.includes = require('lodash/collection/includes');
Substance.map = require('lodash/collection/map');
Substance.pluck = require('lodash/collection/pluck');
Substance.indexBy = require('lodash/collection/indexBy');
Substance.sortBy = require('lodash/collection/sortBy');

Substance.isArrayEqual = function(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// Removes all occurrence of value in array using Array.splice
// I.e., this changes the array instead of creating a new one
// as _.without() does.
Substance.deleteFromArray = function(array, value) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === value) {
      array.splice(i, 1);
      i--;
    }
  }
};

Substance.clone = function(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Substance.isFunction(obj.clone)) {
    return obj.clone();
  }
  return Substance.deepclone(obj);
};

Substance.deepclone = Substance.cloneDeep;

module.exports = Substance;
