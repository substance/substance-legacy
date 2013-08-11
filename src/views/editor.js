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

  this._activeAnnotationToggles = [];
  this._activeAnnotations = [];


  // Writer
  // --------

  this.writer = controller.writer;

  // Surface
  // --------

  // A Substance.Document.Writer instance is provided by the controller
  this.surface = new Substance.Surface(this.controller.writer);

  this.listenTo(this.writer.selection,  "selection:changed", this.updateAnnotationToggles);

  this.$el.delegate('.image-files', 'change', _.bind(this.handleFileSelect, this));

  // Makes the controller switch the application state
  this.$el.delegate('.surface', 'click', _.bind(this.activateWriter, this));

  this.$el.delegate('.document-settings', 'click', _.bind(this.activateTools, this));

  // Confirm link insertion/update
  this.$el.delegate('#link_submission_form', 'submit', _.bind(this.saveLink, this));
  // this.$el.delegate('#link_url', 'change', _.bind(this.saveLink, this));
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
        ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        var mediumImage = canvas.toDataURL("image/png");

        that.writer.insertNode('image', {
          medium: mediumImage
        });

      }, 800);
    };

    reader.readAsDataURL(file);
  };

  // Renders the current selection
  // --------
  //

  this.updateAnnotationToggles = function() {

    var annotations = this.writer.getAnnotations({
      selection: this.writer.selection
    });

    // Note: we must use caching here, as this method is triggered
    // very rapidly (e.g., cursor movement)
    // Otherwise, the cursor will not run smoothly when keys are hold down.

    this.$(this._activeAnnotationToggles).removeClass('active');
    this.$(this._activeAnnotations).removeClass('active');
    this.$('#link_url').hide();

    this._activeAnnotationToggles = [];
    this._activeAnnotations = [];

    _.each(annotations, function(a) {
      this._activateAnnotationToggle(a.type);

      if(a.type === "link") {
        this.modifyLink(a);
      }

      // Mark annotations on the surface as active
      var $a = this.$('#'+a.id);
      $a.addClass('active');
      this._activeAnnotations.push($a[0]);
    }, this);
  };


  // Activates toggle for given annotation `type`
  // --------
  //

  this._activateAnnotationToggle = function(type) {
    var $at = this.$('.annotation-toggle.'+type);
    $at.addClass('active');
    this._activeAnnotationToggles.push($at[0]);
  };

  // Brings up the url form in order to modify an existing link
  // Sets the annotation id as a hidden element
  // --------

  this.modifyLink = function(a) {
    // Remember the annotation that is currently in modify context
    this.currentAnnotation = a;

    this.$('#link_url').val(a.url).show();
  };

  // Switches to the writer state
  // --------

  this.activateWriter = function() {
    this.controller.changeFocus('writer');
  };

  // Switches to document-tool bar
  // --------

  this.activateTools = function() {
    this.controller.changeFocus('tools');

    // Hide Surface cursor
    this.surface.$('.cursor').hide();
  };

  this.toggleSource = function() {
    console.log('toggle it');
    this.$('.show-data').toggleClass('active');
    this.$('.source').val(JSON.stringify(this.writer.__document.toJSON(), null, '  '));
    this.$('.surface').toggle();
    this.$('.source').toggle();
  };

  // Attempt to create a new link annotation
  // --------
  //
  // Shows the link input field and puts the focus there
  // When hitting enter the acutal annotation plus payload (url) 

  this.addLink = function() {
    this.activateTools();
    this.currentAnnotation = null;

    this._activateAnnotationToggle('link');
    this.$('#link_url').val('http://').show().focus();
  };

  // Cancel interaction
  // --------
  //
  // E.g. when 

  this.cancel = function() {
    if (!this.currentAnnotation) {
      this.$('#link_url').hide();
      // Give focus back to surface
      this.activateWriter();
    }
  };

  // Create or update link
  // --------
  //

  this.saveLink = function(e) {
    this.$('#link_url').blur();

    var url = this.$('#link_url').val();
    var a = this.currentAnnotation;
    if (a) {
      this.writer.__document.set([a.id, "url"], url);
    } else {
      this.annotate('link', {url: url});  
    }
    this.activateWriter();
    
    return false;
  };

  // Insert a new image
  // --------
  //

  this.insertImage = function(type) {
    $('.image-files').click();
  };

  // Insert a fresh new node
  // --------
  //

  this.insertNode = function(type) {
    this.writer.insertNode(type);
  };

  // Annotate current selection
  // --------
  //

  this.annotate = function(type, data) {
    this.writer.annotate(type, data);
    this.updateAnnotationToggles();
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
