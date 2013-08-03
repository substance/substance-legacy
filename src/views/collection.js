"use strict";

var _ = require("underscore");
var util = require('substance-util');
var html = util.html;
var Substance = require("../substance");
var View = Substance.Application.View;


// Substance.Collection.View
// ==========================================================================
//
// The Substance Collection Display

var CollectionView = function(controller) {
  View.call(this);

  this.$el.addClass('collection');
  this.controller = controller;
};

CollectionView.Prototype = function() {

  // Rendering
  // --------
  //

  this.render = function() {
    this.$el.html(html.tpl('collection', this.controller.getCollection()));
    return this;
  };

  this.dispose = function() {
    this.stopListening();
  };
};

CollectionView.Prototype.prototype = View.prototype;
CollectionView.prototype = new CollectionView.Prototype();

module.exports = CollectionView;
