'use strict';

var Substance = require('../basics');
var Node = require('./node');
var Factory = Substance.Factory;

function NodeFactory() {
  Factory.call(this);
};

NodeFactory.Prototype = function() {

  this.register = function ( constructor ) {
    var name = constructor.static && constructor.static.name;
    if ( typeof name !== 'string' || name === '' ) {
      throw new Error( 'Node names must be strings and must not be empty' );
    }
    if ( !( constructor.prototype instanceof Node) ) {
      throw new Error( 'Nodes must be subclasses of Substance.Data.Node' );
    }
    this.add(name, constructor);
  };

  this.getClassForHtmlElement = function(el) {
    for (var i = 0; i < this.names.length; i++) {
      var name = this.names[i];
      var NodeClass = this.get(name);
      if (NodeClass.matchElement) {
        var match = NodeClass.matchElement(el);
        if (match) {
          return match;
        }
      }
    }
    return null;
  }
};

Substance.inherit(NodeFactory, Factory);

module.exports = NodeFactory;
