'use strict';

var isEqual = require('lodash/lang/isEqual');
var isObject = require('lodash/lang/isObject');
var isArray = require('lodash/lang/isArray');
var isString = require('lodash/lang/isString');
var isNumber = require('lodash/lang/isNumber');
var isFunction = require('lodash/lang/isFunction');
var cloneDeep = require('lodash/lang/cloneDeep');

var bind = require('lodash/function/bind');
var delay = require('lodash/function/delay');

// Object helpers
var extend = require('lodash/object/extend');

// Array helpers
var last = require('lodash/array/last');
var first = require('lodash/array/first');

// Collection helpers
var forEach = require('lodash/collection/forEach');
var filter = require('lodash/collection/filter');
var includes = require('lodash/collection/includes');
var map = require('lodash/collection/map');
var pluck = require('lodash/collection/pluck');

var Substance = {};

Substance.bind = bind;

Substance.delay = delay;

Substance.delayed = function(func, wait) {
  return function() {
    setTimeout(func, wait);
  };
};

Substance.isEqual = isEqual;

Substance.isObject = isObject;

Substance.isArray = isArray;

Substance.isString = isString;

Substance.isNumber = isNumber;

Substance.isFunction = isFunction;

Substance.isArrayEqual = function(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

Substance.each = forEach;

Substance.filter = filter;
Substance.includes = includes;
Substance.map = map;
Substance.pluck = pluck;

Substance.last = last;
Substance.first = first;

Substance.extend = extend;

Substance.clone = function(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Substance.isFunction(obj.clone)) {
    return obj.clone();
  }
  return Substance.deepclone(obj);
};

Substance.deepclone = cloneDeep;

module.exports = Substance;
