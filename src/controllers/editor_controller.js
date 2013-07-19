"use strict";

var Substance = require("../substance");
var Controller = Substance.Application.Controller;
var Document = Substance.Document;

// Substance Editor Component
// =============================================

// Substance.Editor.Controller
// -----------------
//
// Controls the Editor.View

var EditorController = function(document) {

  // Private reference to the document
  this.__document = document;

  // Interface to document editing
  this.writer = new Document.Writer(document);

  // Main controls
  this.on('show:comments', this.showComments);
};

EditorController.Prototype = function() {

  // Transitions
  // ===================================

  this.showComments = function() {
    var that = this;

    this.comments = new Document.Comments.Controller();
    that.updateState('comments');
  };

  this.getActiveControllers = function() {
    var result = [];
    result.push(["editor", this]);
    result.push(["writer", this.writer]);
    // result = result.concat(this.comments.getActiveControllers());
    return result;
  };

};

EditorController.Prototype.prototype = Controller.prototype;
EditorController.prototype = new EditorController.Prototype();

module.exports = EditorController;
