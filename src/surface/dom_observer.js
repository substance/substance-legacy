'use strict';

var Substance = require('../basics');

// DomObserver will serve us as a fallback to detect document changes triggered by the UI,
// e.g., when the user uses the browser's context menu.
function DomObserver(surface) {
  this.surface = surface;
};

DomObserver.Prototype = function() {

  this.start = function() {

  };

  this.stop = function() {

  };

};

Substance.inherit(DomObserver, Substance.EventEmitter);

module.exports = DomObserver;
