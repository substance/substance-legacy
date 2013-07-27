"use strict";

var Substance = require("../substance");
var Controller = Substance.Application.Controller;
var Document = Substance.Document;
var EditorView = require('../views/editor');
var util = require('substance-util');


// Line Behavior Mixin
// -----------------
//

var LineBehavior = function(selection, surface) {

  var __find__ = selection.find;
  var __set__ = selection.set;

  var verticalNav = false;
  var iniX;

  var getOL = function (el) {
    var rect = el.getClientRects();
    return rect[0].left;
  };

  var resetCursor = function() {
    var span = getSpan();
    if(!span) return;
    iniX = getOL(span);
    console.log('span', span);
    console.log('iniX', iniX);
  };

  var getSpan = function() {
    var sel = selection.getCursor();
    if(!sel) return;
    var nodeEl = surface.el.children[sel[0]];
    var content = nodeEl.children[0]; // [1] is the cursor div
    var span = content.children[sel[1]];
    return span;
  };

  var upDown = function(direction) {

    var sel = selection.getCursor();
    var node = sel[0];
    var charOffset = sel[1];
    var foundline = false;
    var span = getSpan();
    var iniY = span.offsetTop;

    if (iniX === undefined) {
      iniX = getOL(span);
    }

    var go = (direction === "down") ? span.nextSibling: span.previousSibling;
    
    while (go) {

      if (direction === "down") {
        span = span.nextSibling;
        charOffset ++;
      } else {
        span = span.previousSibling;
        charOffset --;
      }

      if (span.offsetTop !== iniY) {
        foundline = true;
      }

      if (direction === "down") {
        if (foundline && getOL(span) > iniX) {
          return [node, charOffset];
        }
      } else {
        if (foundline && getOL(span) < iniX) {
          return [node, charOffset+1];
        }
      }
    }
  };

  selection.prevLine = function(pos) {
    return upDown('up');
  };

  selection.nextLine = function(pos) {
    return upDown('down');
  };

  selection.set = function(pos, direction, granularity) {

    __set__.call(this, pos, direction, granularity);
    
    if(!verticalNav) {
      resetCursor();
    }
    verticalNav = false;
    
  };

  selection.find = function(pos, direction, granularity) {
    if (granularity === "line") {
      verticalNav = true;
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
    var surface = view.surface;

    // Mixin Line behavior into selection object
    LineBehavior(this.writer.selection, surface);
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
