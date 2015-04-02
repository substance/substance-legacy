'use strict';

var oo = require('./oo');
var Registry = require('./registry');

function Factory() {
  Factory.super.call(this);
}

Factory.Prototype = function() {

  this.create = function ( name ) {
    var constructor = this.get(name);
    if ( !constructor ) {
      throw new Error( 'No class registered by that name: ' + name );
    }
    // call the constructor providing the remaining arguments
    var args = Array.prototype.slice.call( arguments, 1 );
    var obj = Object.create( constructor.prototype );
    constructor.apply( obj, args );
    return obj;
  };

};

oo.inherit(Factory, Registry);

module.exports = Factory;
