"use strict";

var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;

function ContentToolbar() {
  Component.apply(this, arguments);
}

ContentToolbar.Prototype = function() {

  this.getClassNames = function() {
    return "content-tools-component";
  };

  this.render = function() {
    var tools = this.props.tools.map(function(tool) {
      return $$(tool, { doc: this.props.doc });
    });
    return $$('div', {className: "tools"}, tools);
  };
};

OO.inherit(ContentToolbar, Component);

module.exports = ContentToolbar;
