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

  this.$el.addClass('editor');
  
  this.controller = controller;

  // Writer
  // --------

  this.writer = controller.writer;

  this.listenTo(this.writer.selection, 'selection:changed', this.toggleAnnotationToggles);

  // Surface
  // --------

  // A Substance.Document.Writer instance is provided by the controller
  this.surface = new Substance.Surface(this.controller.writer);

  this.$el.delegate('.image-files', 'change', _.bind(this.handleFileSelect, this));

};

EditorView.Prototype = function() {


  this.handleFileSelect = function(evt) {

    var that = this;
    evt.stopPropagation();
    evt.preventDefault();

    // from an input element
    var filesToUpload = evt.target.files;
    var file = filesToUpload[0];

    // TODO: display error message
    if (!file.type.match('image.*')) return console.log('Not an image. Skipping...');

    var img = document.createElement("img");
    var reader = new FileReader();

    reader.onload = function(e) {
      img.src = e.target.result;
      var largeImage = img.src;

      _.delay(function() {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var MAX_WIDTH = 800;
        var MAX_HEIGHT = 1000;
        var width = img.width;
        var height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        var mediumImage = canvas.toDataURL("image/png");

        that.insertImage('image', {
          medium: mediumImage
        });

      }, 800);
    };

    reader.readAsDataURL(file);

  };

  this.toggleAnnotationToggles = function() {
    var sel = this.writer.selection;
    if (sel.getNodes().length === 1 && !sel.isCollapsed()) {
      this.$('.annotation-toggles').show();
    } else {
      this.$('.annotation-toggles').hide();
    }
  };


  // Insert a new image
  // --------
  //

  this.insertImage = function(type, data) {
    this.surface.insertImage(type, data);
  };

  // Insert a fresh new node
  // --------
  //

  this.insertNode = function(type, data) {
    this.surface.insertNode(type, data);
  };


  // Brings up the node insertion toggles
  // --------
  //

  this.toggleNodeInserter = function() {
    this.surface.toggleNodeInserter();
  };

  // Clear selection
  // --------
  //

  this.clear = function() {

  };

  // Annotate current selection
  // --------
  //

  this.annotate = function(type) {
    this.writer.annotate(type);
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
