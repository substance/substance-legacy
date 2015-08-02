'use strict';

var OO = require('../basics/oo');
var Component = require('./component');

function FontAwesomeIcon() {
  Component.Container.apply(this, arguments);
}

FontAwesomeIcon.Prototype = function() {

  this.tagName = 'i';

  this.getClassNames = function() {
    return 'fa ' + this.props.icon;
  };

};

OO.inherit(FontAwesomeIcon, Component.Container);

module.exports = FontAwesomeIcon;
