"use strict";

var _ = require("underscore");
var util = require("substance-util");
var html = util.html;
var View = require("substance-application").View;
var CollectionView = require("./collection");


// Substance.Editor.View
// ==========================================================================
//
// The Substance Document Editor

var LibraryView = function(controller) {
  View.call(this);

  this.$el.addClass('library');
  this.controller = controller;

  this.collectionView = new CollectionView(controller);
};

LibraryView.Prototype = function() {

  this.importDocument = function() {
    var url = this.$('#import_url').val();
    // Rather nasty, get rid of it
    window.Substance.app.router.navigate('documents/'+encodeURIComponent(url), true);
  };

  // Rendering
  // --------
  //

  this.render = function() {
    this.$el.html(html.tpl('library', this.controller));

    // Render current collection
    this.$('.collection').replaceWith(this.collectionView.render().el);
    return this;
  };

  this.dispose = function() {
    this.stopListening();
  };
};

LibraryView.Prototype.prototype = View.prototype;
LibraryView.prototype = new LibraryView.Prototype();

module.exports = LibraryView;
