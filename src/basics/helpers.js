'use strict';

/**
 * Mostly taken from lodash.
 *
 * @class Helpers
 * @static
 * @module Basics
 */
var Helpers = {};

// Lang helpers

/**
 * See https://lodash.com/docs#isEqual
 * @method isEqual
 */
Helpers.isEqual = require('lodash/lang/isEqual');
/**
 * See https://lodash.com/docs#isObject
 * @method isObject
 */
Helpers.isObject = require('lodash/lang/isObject');
/**
 * See https://lodash.com/docs#isArray
 * @method isArray
 */
Helpers.isArray = require('lodash/lang/isArray');
/**
 * See https://lodash.com/docs#isString
 * @method isString
 */
Helpers.isString = require('lodash/lang/isString');
/**
 * See https://lodash.com/docs#isNumber
 * @method isNumber
 */
Helpers.isNumber = require('lodash/lang/isNumber');
/**
 * See https://lodash.com/docs#isBoolean
 * @method isBoolean
 */
Helpers.isBoolean = require('lodash/lang/isBoolean');
/**
 * See https://lodash.com/docs#isFunction
 * @method isFunction
 */
Helpers.isFunction = require('lodash/lang/isFunction');
/**
 * See https://lodash.com/docs#cloneDeep
 * @method cloneDeep
 */
Helpers.cloneDeep = require('lodash/lang/cloneDeep');

// Function helpers

/**
 * See https://lodash.com/docs#bind
 * @method bind
 */
Helpers.bind = require('lodash/function/bind');
/**
 * See https://lodash.com/docs#delay
 * @method delay
 */
Helpers.delay = require('lodash/function/delay');
/**
 * See https://lodash.com/docs#debounce
 * @method debounce
 */
Helpers.debounce = require('lodash/function/debounce');

// Object helpers

/**
 * See https://lodash.com/docs#extend
 * @method extend
 */
Helpers.extend = require('lodash/object/extend');

// Array helpers

/**
 * See https://lodash.com/docs#last
 * @method last
 */
Helpers.last = require('lodash/array/last');
/**
 * See https://lodash.com/docs#first
 * @method first
 */
Helpers.first = require('lodash/array/first');
/**
 * See https://lodash.com/docs#compact
 * @method compact
 */
Helpers.compact = require('lodash/array/compact');
/**
 * See https://lodash.com/docs#uniq
 * @method uniq
 */
Helpers.uniq = require('lodash/array/uniq');
/**
 * See https://lodash.com/docs#intersection
 * @method intersection
 */
Helpers.intersection = require('lodash/array/intersection');
/**
 * See https://lodash.com/docs#union
 * @method union
 */
Helpers.union = require('lodash/array/union');
/**
 * See https://lodash.com/docs#without
 * @method without
 */
Helpers.without = require('lodash/array/without');

// Collection helpers

/**
 * See https://lodash.com/docs#each
 * @method each
 */
Helpers.each = require('lodash/collection/forEach');
/**
 * See https://lodash.com/docs#filter
 * @method filter
 */
Helpers.filter = require('lodash/collection/filter');
/**
 * See https://lodash.com/docs#includes
 * @method includes
 */
Helpers.includes = require('lodash/collection/includes');
/**
 * See https://lodash.com/docs#map
 * @method map
 */
Helpers.map = require('lodash/collection/map');
/**
 * See https://lodash.com/docs#pluck
 * @method pluck
 */
Helpers.pluck = require('lodash/collection/pluck');
/**
 * See https://lodash.com/docs#indexBy
 * @method indexBy
 */
Helpers.indexBy = require('lodash/collection/indexBy');
/**
 * See https://lodash.com/docs#sortBy
 * @method sortBy
 */
Helpers.sortBy = require('lodash/collection/sortBy');

/**
 * Check if two arrays are equal.
 *
 * @method isArrayEqual
 * @param {Array} a
 * @param {Array} b
 * @deprecated use `Helpers.isEqual` instead.
 */
Helpers.isArrayEqual = function(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

/**
 * Removes all occurrence of value in array using Array.splice
 * I.e., this changes the array instead of creating a new one
 * as _.without() does.
 *
 * @method deleteFromArray
 * @param {Array} array
 * @param value
 */
Helpers.deleteFromArray = function(array, value) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === value) {
      array.splice(i, 1);
      i--;
    }
  }
};


/**
 * Clones a given object.
 * Uses obj.clone() if available, otherwise delegates to _.cloneDeep().
 *
 * @method clone
 * @param {Object} obj
 * @return The cloned object.
 */
Helpers.clone = function(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Helpers.isFunction(obj.clone)) {
    return obj.clone();
  }
  return Helpers.deepclone(obj);
};

/**
 * Alias for {{#crossLink "Helpers/cloneDeep:method"}}{{/crossLink}}.
 * @method deepClone
 */
Helpers.deepclone = Helpers.cloneDeep;

/**
 * Web helper to compute the relative offset of an element to an ancestor element.
 *
 * @method getRelativeOffset
 * @param {jQuery.Selector} $element
 * @param {jQuery.Selector} $ancestor
 * @return An object with properties
 *   - top: Number
 *   - left: Number
 */
Helpers.getRelativeOffset = function ( $element, $ancestor ) {
  var pos = $element.offset();
  var ancestorPos = $ancestor.offset();
  pos.left -= ancestorPos.left;
  pos.top -= ancestorPos.top;
  return pos;
};

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com
Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/**
 * Generates a unique id.
 *
 * @method uuid
 * @param {String} [prefix] if provided the UUID will be prefixed.
 * @param {Number} [len] if provided a UUID with given length will be created.
 * @return A generated uuid.
 */
Helpers.uuid = function (prefix, len) {
  if (prefix && prefix[prefix.length-1] !== "_") {
    prefix = prefix.concat("_");
  }
  var chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split(''),
      uuid = [],
      radix = 16,
      idx;
  len = len || 32;
  if (len) {
    // Compact form
    for (idx = 0; idx < len; idx++) uuid[idx] = chars[0 | Math.random()*radix];
  } else {
    // rfc4122, version 4 form
    var r;
    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';
    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (idx = 0; idx < 36; idx++) {
      if (!uuid[idx]) {
        r = 0 | Math.random()*16;
        uuid[idx] = chars[(idx == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return (prefix ? prefix : "") + uuid.join('');
};

module.exports = Helpers;
