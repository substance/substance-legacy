"use strict";

var Substance = require("../substance");
var Controller = Substance.Application.Controller;
var Document = Substance.Document;
var EditorView = require('../views/editor');
//var util = require('substance-util');


// Line Behavior Mixin
// -----------------
//

var addLineBehavior = function(selection, surface) {

  var __find__ = selection.find;
  var __set__ = selection.set;

  var verticalNav = false;
  var iniX;

  var getOL = function (el) {
    var rect = el.getClientRects();
    return rect[0].left;
  };

  var getOT = function (el) {
    var rect = el.getClientRects();
    return rect[0].top;
  };

  var resetCursor = function() {
    var span = getSpan();
    if(!span) return;
    iniX = getOL(span);
    console.log('span', span);
    console.log('iniX', iniX);
  };

  var getSpan = function(sel) {
    sel = sel || selection.getCursor();
    if (!sel) return;

    var nodeEl = surface.el.children[sel[0]];
    var content = nodeEl.children[0]; // [1] is the cursor div
    var span = content.children[sel[1]];
    return span;
  };

  var _hasNextChar = function(direction, nodePos, charPos) {
    var pos;
    var newPos;

    var node = selection.getNodeAtPosition(nodePos);

    if (!node) return false;

    if (direction === "down") {
      return (charPos < node.content.length-1);
    } else {
      return charPos > 0;
    }
  };

  var _hasNextNode = function(direction, nodePos) {

    if (direction === "down") {
      return selection.hasSuccessor(nodePos);
    } else {
      return selection.hasPredecessor(nodePos);
    }

  };

  var upDown = function(direction) {

/*
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
*/

    var nodePos;
    var charOffset;
    var hasNextChar;
    var hasNextNode;
    var sel = selection.getCursor();

    if (!sel) {
      return [0,0];
    }

    nodePos = sel[0];
    charOffset = sel[1];

    hasNextNode = _hasNextNode(direction, nodePos);
    hasNextChar = _hasNextChar(direction, nodePos, charOffset);

    var cursorRect = $('.cursor')[0].getClientRects()[0];
    var iniY = cursorRect.top;
    if (iniX === undefined) {
      iniX = cursorRect.left;
    }

    if (!hasNextChar) {

      if (hasNextNode) {
        var pos;
        if (direction === "down") {
          // enter the next node and start iterating from left to right
          pos = selection.nextChar([nodePos, charOffset]);
        } else {
          // enter the previous node and start iterating from right to left
          pos = selection.prevChar([nodePos, charOffset]);
        }
        nodePos = pos[0];
        charOffset = pos[1];

        console.log("Jumping nodes", nodePos, charOffset);

        hasNextChar = _hasNextChar(direction, nodePos, charOffset);
      }

    }

    if (hasNextChar) {
      var span = getSpan([nodePos, charOffset]);
      var foundline = false;

      while (hasNextChar) {

        if (direction === "down") {
          span = span.nextSibling;
          charOffset ++;
        } else {
          // Hack: in the case we start at the end of a node the initial span is null
          // in that case we take last span of the
          if (!span) {
            var pos = selection.prevChar([nodePos, charOffset]);
            span = getSpan(pos);
          } else {
            span = span.previousSibling;
          }
          charOffset --;
        }

        if (direction === "down") {
          if ((getOT(span) > iniY) && (getOL(span) > iniX)) {
            break;
          }
        } else {
          if ((getOT(span) < iniY) && (getOL(span) <= iniX)) {
            break;
          }
        }

        hasNextChar = _hasNextChar(direction, nodePos, charOffset);

        // HACK: if we are at the boundary and moving downwards increase the position by one
        if (!hasNextChar) {

          if (direction === "down") {
            console.log("Downward movement hack.");
            charOffset++;
          } else {
            console.log("Upward movement hack.");
            charOffset--;
          }
        }

        //console.log("###", nodePos, charOffset, hasNextChar);
      }
    }

    if (direction === "down") {
      return [nodePos, charOffset];
    } else {
      return [nodePos, charOffset+1];
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
        return this.nextLine(pos);
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
    addLineBehavior(this.writer.selection, surface);
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
