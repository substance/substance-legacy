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

  var _cache, _cachePos;

  var getX = function (el) {
    var rect = el.getClientRects();
    return rect[0].left;
  };

  var getY = function (el) {
    var rect = el.getClientRects();
    return rect[0].top;
  };

  // Retrieves the current cursor position
  // --------
  //

  var getCursorRect = function() {
    var el = surface.$('.cursor')[0];
    if (!el) return null;
    return el.getClientRects()[0];
  };

  var resetCursor = function() {
    if (!cursor.isValid()) return;
    var rect = getCursorRect();
    if(rect !== null) {
      iniX = rect.left;
    } else {
      iniX = null;
    }
    _cache = [];
    _cachePos = -1;
  };

  var _stepVertical = function(direction) {

    // try to use a previous cached position first
    if (direction === "up" && _cache.length > _cachePos + 1) {
      _cachePos += 1;
      cursor.nodePos = _cache[_cachePos].nodePos;
      cursor.charPos = _cache[_cachePos].charPos;
      return;
    } else if (direction === "down" && _cachePos > 0) {
      _cachePos -= 1;
      cursor.nodePos = _cache[_cachePos].nodePos;
      cursor.charPos = _cache[_cachePos].charPos;
      return;
    }

    var iterator = cursor.copy();
    var nodePos, node, nodeView, wPos;

    var previousY = undefined;
    var lineSteps = 0;

    while (true) {

      // TODO: iterate over ranges

      if (node === undefined || nodePos !== iterator.nodePos) {
        nodePos = iterator.nodePos;
        node = surface.writer.getNodeFromPosition(iterator.nodePos);
        nodeView = surface.nodes[node.id];
      }

      wPos = nodeView.getDOMPosition(iterator.charPos);
      var rect = wPos.getClientRects()[0];

      // console.log("cursor._stepVertical", iterator.nodePos, iterator.charPos);
      // console.log("...", rect.left, iniX, rect.top, startY);

      if (direction === "up") {
        iterator.move("left", "char");
      } else {
        iterator.move("right", "char");
      }

      if (iterator.nodePos === 0 && iterator.charPos === 0) {
        break;
      }

      if (rect === undefined) {
        continue;
      }

      if (previousY === undefined) {
        previousY = rect.top;
        continue;
      }

      if (previousY !== rect.top) {
        previousY = rect.top;
        lineSteps += 1;
      }

      if (direction === "up") {
        var isStart = iterator.isLeftBound();
        if ((lineSteps > 0 && (rect.left <= iniX || isStart)) || lineSteps === 2) {
          if (!isStart) iterator.move("right", "char");
          break;
        }
      } else {
        var isEnd = iterator.isRightBound();
        if ( (lineSteps > 0 && (rect.left >= iniX || isEnd)) || lineSteps === 2) {
          if (!isEnd) iterator.move("left", "char");
          // trial error adjusted
          if (lineSteps === 2) iterator.move("left", "char");
          break;
        }
      }
    }

    if (direction === "up") {
      _cache.push(iterator);
      _cachePos = _cache.length-1;
    } else {
      _cache.unshift(iterator);
      _cachePos = 0;
    }

    cursor.nodePos = iterator.nodePos;
    cursor.charPos = iterator.charPos;
  };

  cursor.prevLine = function() {
    _stepVertical('up');
  };

  cursor.nextLine = function() {
    _stepVertical('down');
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
      }

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

  this.insertImage = function() {
    this.view.insertImage();
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

  // Cancel current user action (e.g. link insertion)
  // --------
  //
  // For some reason this does not get triggered when the focus in the URL input form

  this.cancel = function() {
    if (this.currentState === "tools") {
      this.view.cancel();
    }
  };

  // Blur
  // -------
  // Makes the editor the active controller, and thus disabled keybindings
  // for the writer
  //
  // TODO: find a better name

  this.changeFocus = function(view) {
    if (view === this.currentState) return; // Nothing to do here, move along

    this.currentState = view;
    // This is a hack to make the keyboard pull the new app state
    // Oliver: How can we do better?
    window.Substance.app.keyboard.stateChanged();

  };

  // --------
  //

  this.getActiveControllers = function() {

    var result = [];
    result.push(["editor", this]);
    if (this.currentState === "writer") {
      result.push(["writer", this.writer]);
    }
    return result;
  };

};

EditorController.Prototype.prototype = Controller.prototype;
EditorController.prototype = new EditorController.Prototype();

module.exports = EditorController;
