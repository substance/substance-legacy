'use strict';

var _ = require('./helpers');
var extend;

function initClass(fn) {
  if ( fn.Prototype && !(fn.prototype instanceof fn.Prototype) ) {
    fn.prototype = new fn.Prototype();
    fn.prototype.constructor = fn;
  }
  fn.static = fn.static || {};
  fn.extend = fn.extend || _.bind(extend, null, fn);
}

function inherit(targetFn, originFn) {
  if ( targetFn.prototype instanceof originFn ) {
    throw new Error( 'Target already inherits from origin' );
  }
  var targetConstructor = targetFn.prototype.constructor;
  // Customization: supporting a prototype constructor function
  // defined as a static member 'Prototype' of the target function.
  var TargetPrototypeCtor = targetFn.Prototype;
  // Provide a shortcut to the parent constructor
  targetFn.super = originFn;
  if (TargetPrototypeCtor) {
    TargetPrototypeCtor.prototype = originFn.prototype;
    targetFn.prototype = new TargetPrototypeCtor();
    targetFn.prototype.constructor = targetFn;
  } else {
    targetFn.prototype = Object.create( originFn.prototype, {
      // Restore constructor property of targetFn
      constructor: {
        value: targetConstructor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    } );
  }
  // provide a shortcut to the parent prototype
  targetFn.prototype.super = originFn.prototype;
  // Extend static properties - always initialize both sides
  initClass( originFn );
  targetFn.static = Object.create( originFn.static );
  targetFn.extend = _.bind(extend, null, targetFn);
}

function mixin(targetFn, originFn) {
  var key;
  var prototype = originFn.prototype;
  if (originFn.Prototype) {
    prototype = new originFn.Prototype();
  }
  // Copy prototype properties
  for ( key in prototype ) {
    if ( key !== 'constructor' && prototype.hasOwnProperty( key ) ) {
      targetFn.prototype[key] = prototype[key];
    }
  }
  // Copy static properties - always initialize both sides
  initClass( targetFn );
  if ( originFn.static ) {
    for ( key in originFn.static ) {
      if ( originFn.static.hasOwnProperty( key ) ) {
        targetFn.static[key] = originFn.static[key];
      }
    }
  } else {
    initClass( originFn );
  }
}

extend = function( parent, proto ) {
  var ctor = function $$$() {
    parent.apply(this, arguments);
    if (this._init) {
      this._init();
    }
  };
  inherit(ctor, parent);
  for(var key in proto) {
    if (proto.hasOwnProperty(key)) {
      if (key === "name") {
        continue;
      }
      ctor.prototype[key] = proto[key];
    }
  }
  ctor.static.name = proto.name;
  return ctor;
};

module.exports = {
  initClass: initClass,
  inherit: inherit,
  mixin: mixin
};
