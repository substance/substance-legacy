"use strict";

var Substance = require("../substance");
var Controller = Substance.Application.Controller;
var Document = Substance.Document;
var EditorView = require('../views/editor');
var util = require('substance-util');


// Line Behavior Mixin
// -----------------
//

var LineBehavior = function(selection, editorView) {

  var __find__ = selection.find;

  selection.prevLine = function(pos) {
    console.log('finding prev line');
    // use editorView
    return pos;
  };

  selection.nextLine = function(pos) {
    console.log('do stuff next-line');
    // use editorView
    return pos;
  };

  selection.find = function(pos, direction, granularity) {
    if (granularity === "line") {
      if (direction === "left") {
        return this.prevLine(pos);
      } else {
        return this.nextLine(pos)
      }
    } else {
      return __find__.call(this, pos, direction, granularity);
    }
  };
};


// Substance.Editor.Controller
// -----------------
//
// Controls the Editor.View

var EditorController = function(document) {

  // Private reference to the document
  this.__document = document;

  // Main controls
  this.on('show:comments', this.showComments);

};

EditorController.Prototype = function() {

  this.createView = function() {
    this.writer = new Document.Writer(this.__document);
    var view = new EditorView(this);

    // Mixin Line behavior into selection object
    LineBehavior(this.writer.selection, view);
    return view;
  };


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
