'use strict';

var oo = require("./oo");

function EventEmitter() {
  this.__events__ = {};
}

EventEmitter.Prototype = function() {

  function validateMethod( method, context ) {
    // Validate method and context
    if ( typeof method === 'string' ) {
      // Validate method
      if ( context === undefined || context === null ) {
        throw new Error( 'Method name "' + method + '" has no context.' );
      }
      if ( !( method in context ) ) {
        // Technically the method does not need to exist yet: it could be
        // added before call time. But this probably signals a typo.
        throw new Error( 'Method not found: "' + method + '"' );
      }
      if ( typeof context[method] !== 'function' ) {
        // Technically the property could be replaced by a function before
        // call time. But this probably signals a typo.
        throw new Error( 'Property "' + method + '" is not a function' );
      }
    } else if ( typeof method !== 'function' ) {
      throw new Error( 'Invalid callback. Function or method name expected.' );
    }
  }

  this.on = function ( event, method, args, context ) {
    var bindings;

    validateMethod( method, context );

    if ( this.__events__.hasOwnProperty( event ) ) {
      bindings = this.__events__[event];
    } else {
      // Auto-initialize bindings list
      bindings = this.__events__[event] = [];
    }
    // Add binding
    bindings.push( {
      method: method,
      args: args,
      context: ( arguments.length < 4 ) ? null : context
    } );
    return this;
  };

  this.once = function ( event, listener ) {
    var eventEmitter = this;
    var listenerWrapper = function () {
      eventEmitter.off( event, listenerWrapper );
      listener.apply( eventEmitter, Array.prototype.slice.call( arguments, 0 ) );
    };
    return this.on( event, listenerWrapper );
  };

  this.off = function ( event, method, context ) {
    var i, bindings;

    if ( arguments.length === 1 ) {
      // Remove all bindings for event
      delete this.__events__[event];
      return this;
    }

    validateMethod( method, context );

    if ( !( event in this.__events__ ) || !this.__events__[event].length ) {
      // No matching bindings
      return this;
    }

    // Default to null context
    if ( arguments.length < 3 ) {
      context = null;
    }

    // Remove matching handlers
    bindings = this.__events__[event];
    i = bindings.length;
    while ( i-- ) {
      if ( bindings[i].method === method && bindings[i].context === context ) {
        bindings.splice( i, 1 );
      }
    }

    // Cleanup if now empty
    if ( bindings.length === 0 ) {
      delete this.__events__[event];
    }
    return this;
  };

  this.emit = function ( event ) {
    var i, len, binding, bindings, args, method;

    if ( event in this.__events__ ) {
      // Slicing ensures that we don't get tripped up by event handlers that add/remove bindings
      bindings = this.__events__[event].slice();
      args = Array.prototype.slice.call( arguments, 1 );
      for ( i = 0, len = bindings.length; i < len; i++ ) {
        binding = bindings[i];
        if ( typeof binding.method === 'string' ) {
          // Lookup method by name (late binding)
          method = binding.context[ binding.method ];
        } else {
          method = binding.method;
        }
        method.apply(
          binding.context,
          binding.args ? binding.args.concat( args ) : args
        );
      }
      return true;
    }
    return false;
  };

  this.connect = function ( context, methods ) {
    var method, args, event;

    for ( event in methods ) {
      method = methods[event];
      // Allow providing additional args
      if ( Array.isArray( method ) ) {
        args = method.slice( 1 );
        method = method[0];
      } else {
        args = [];
      }
      // Add binding
      this.on( event, method, args, context );
    }
    return this;
  };

  this.disconnect = function ( context, methods ) {
    var i, event, bindings;

    if ( methods ) {
      // Remove specific connections to the context
      for ( event in methods ) {
        this.off( event, methods[event], context );
      }
    } else {
      // Remove all connections to the context
      for ( event in this.__events__ ) {
        bindings = this.__events__[event];
        i = bindings.length;
        while ( i-- ) {
          // bindings[i] may have been removed by the previous step's
          // this.off so check it still exists
          if ( bindings[i] && bindings[i].context === context ) {
            this.off( event, bindings[i].method, context );
          }
        }
      }
    }

    return this;
  };
};

oo.initClass( EventEmitter );

module.exports = EventEmitter;
