"use strict";

var Substance = require("../substance");
var Controller = Substance.Application.Controller;
var Document = Substance.Document;
var EditorView = require('../views/editor');
//var util = require('substance-util');


// Line Behavior Mixin
// -----------------
//

var addLineBehavior = function(surface, cursor) {

  var __move__ = cursor.move;
  var __set__ = cursor.set;

  var verticalNav = false;
  var iniX;

  var getX = function (el) {
    var rect = el.getClientRects();
    return rect[0].left;
  };

  var getY = function (el) {
    var rect = el.getClientRects();
    return rect[0].top;
  };

  var getNodeElement = function(nodePos) {
    return surface.$('.nodes')[0].children[nodePos];
  };

  var getContent = function(nodePos) {
    var nodeEl = getNodeElement(nodePos);
    var content = nodeEl.children[0]; // [1] is the cursor div
    return content;
  };

  var getSpan = function(nodePos, charPos) {
    var content = getContent(nodePos);
    var span = content.children[charPos];
    return span;
  };

  // Retrieves the current cursor position
  // --------
  // If there is no cursor it takes the sṕan of the given position
  var getCursorRect = function() {
    var el = surface.$('.cursor')[0];
    // if there is no cursor we try to find other ways
    //  - the span of the current char position
    //  - the current node
    if (!el) {
      // Get the element of the current position
      el = getSpan(cursor.nodePos, cursor.charPos);

      // this happens if we are at the end of a node or in an empty node
      if (!el) {
        if(cursor.charPos > 0) {
          // use the element for the previous position
          el = getSpan(cursor.nodePos, cursor.charPos-1);
        } else {
          // use the node element (~empty node)
          el = getNodeElement(cursor.nodePos);
        }
      }
    }

    return el.getClientRects()[0];
  };

  var resetCursor = function() {
    if (!cursor.isValid()) return;
    var rect = getCursorRect();
    iniX = rect.left;
  };

  var upDown = function(direction) {

    var initialNodePos;
    var span;

    // we have to keep the initial node position
    // to detect the number of skipped nodes.
    initialNodePos = cursor.nodePos;

    // we take the absolute position of the cursor element as reference position
    var cursorRect = getCursorRect();

    var initialY = cursorRect.top;
    if (iniX === undefined) {
      iniX = cursorRect.left;
    }

    var lineSteps = 0;
    var lastY = initialY;
    var x,y;

    while (true) {

      if (direction === "down") {
        // enter the next node and start iterating from left to right
        cursor.nextChar();

        if (cursor.isEndOfDocument()) break;
      } else {
        // enter the previous node and start iterating from right to left
        cursor.prevChar();

        if (cursor.isBeginOfDocument()) break;
      }

      // Stop if we reach the end of document
      // or the end of the next node (not stepping over a whole node)
      if (Math.abs(cursor.nodePos-initialNodePos) > 1) {
        break;
      }

      span = getSpan(cursor.nodePos, cursor.charPos);

      // at the end of a node we won't get a span element for the position,
      // as the selection has an extra position after the last character
      if (!span) {
        continue;
      }

      x = getX(span);
      y = getY(span);

      if (y !== lastY) {
        lineSteps++;
        lastY = y;
      }

      if (lineSteps === 0) {
        continue;
      }

      if (direction === "down") {
        if (x >= iniX || lineSteps > 1) break;
      } else {
        // only skip one line at once.
        if (x <= iniX || lineSteps > 1) break;
      }
    }

    // As we haved stopped left to the reference position and the cursor gets rendered on the left side
    // of the current element, we need to put the position to the next char.
    // However, we do not do this at the begin of line and end of line (otherwise cursor gets rendered in the wrong row).

    if (direction === "up") {

      //var content = getContent(pos[0]);

      span = getSpan(cursor.nodePos, cursor.charPos);
      y = getY(span);

      var prevPos = cursor.copy();
      prevPos.prevChar();
      var prevSpan = getSpan(prevPos.nodePos, prevPos.charPos);

      var nextPos = cursor.copy();
      nextPos.nextChar();
      var nextSpan = getSpan(nextPos.nodePos, nextPos.charPos);

      var beginOfLine = (!prevSpan || cursor.isBeginOfDocument() || getY(prevSpan) !== y);
      var endOfLine = (cursor.isEndOfDocument() || (nextSpan && getY(nextSpan) !== y));

      if (!beginOfLine && !endOfLine) {
        cursor.nextChar();
      }
    } else {
      // only skip one line at once.
      // E.g, this happens when there are shorter wrapped lines than the one we started
      // As we have proceeded to the next line already we have to put the cursor one back
      if (!cursor.isEndOfDocument()) {
        cursor.prevChar();
      }
    }
  };

  cursor.prevLine = function() {
    upDown('up');
  };

  cursor.nextLine = function() {
    upDown('down');
  };

  cursor.set = function(nodePos, charPos) {
    __set__.call(this, nodePos, charPos);
    verticalNav = false;
  };

  cursor.move = function(direction, granularity) {
    if (granularity === "line") {

      // setting a flag that lets `selection.set` detect
      // whether the position was set after find('line')
      if (!verticalNav) {
        resetCursor();
        verticalNav = true;
      };

      if (direction === "left") {
        return this.prevLine();
      } else {
        return this.nextLine();
      }

    } else {
      __move__.call(this, direction, granularity);
      verticalNav = false;
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
    this.view = view;
    var surface = view.surface;

    // Mixin Line behavior into selection object
    addLineBehavior(surface, this.writer.selection.__cursor);
    return view;
  };

  // Assumes there is a view already
  //

  this.toggleNodeInserter = function() {
    this.view.toggleNodeInserter();
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
