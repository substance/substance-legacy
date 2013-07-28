"use strict";

var _ = require("underscore");
var util = require('substance-util');
var html = util.html;
var Substance = require("../substance");
var View = Substance.Application.View;


// Substance.Editor.View
// ==========================================================================
//
// The Substance Document Editor

var EditorView = function(controller) {
  View.call(this);

  this.controller = controller;

  // Writer
  // --------

  this.writer = controller.writer;

  this.listenTo(this.writer.selection, 'selection:changed', this.toggleAnnotationToggles);

  // Surface
  // --------

  // A Substance.Document.Writer instance is provided by the controller
  this.surface = new Substance.Surface(this.controller.writer);
};

EditorView.Prototype = function() {


  this.toggleAnnotationToggles = function() {
    var sel = this.writer.selection;
    if (sel.getNodes().length === 1 && !sel.isCollapsed()) {
      this.$('.annotation-toggles').show();
    } else {
      this.$('.annotation-toggles').hide();
    }
    
  };

  // Annotate current selection
  // --------
  //

  this.annotate = function(type) {
    this.writer.annotate(type);
    return false;
  };

  // Annotate current selection
  // --------
  //

  this.insertNode = function(type) {
    this.writer.insertNode(type);
    return false;
  };

  // Rendering
  // --------
  //

  this.render = function() {
    this.$el.html(html.tpl('editor', this.controller));
    this.$('#document .surface').replaceWith(this.surface.render().el);
    return this;
  };

  this.dispose = function() {
    this.surface.dispose();
    this.stopListening();
  };
};

EditorView.Prototype.prototype = View.prototype;
EditorView.prototype = new EditorView.Prototype();

module.exports = EditorView;
