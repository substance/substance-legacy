'use strict';

var Substance = require('../basics');
var PropertySelection = require('./property_selection');

function ContainerSelection(containerName, range, reverse) {
  // Note: not calling the super ctor as it freezes the instance
  this.container = containerName;
  this.range = range;
  this.reverse = reverse;
  this.collapsed = range.start.equals(range.end);
  Object.freeze(this);
}

ContainerSelection.Prototype = function() {

  this.isPropertySelection = function() {
    return false;
  };

  this.isContainerSelection = function() {
    return true;
  };

  this.toString = function() {
    return "ContainerSelection("+ this.container + ", (" + JSON.stringify(this.range.start.path) + ":" + this.range.start.offset + " -> " +  JSON.stringify(this.range.end.path) + ":" + this.range.end.offset + ")" + (this.reverse ? ", reverse" : "") + ")";
  };

};

Substance.inherit(ContainerSelection, PropertySelection);

module.exports = ContainerSelection;