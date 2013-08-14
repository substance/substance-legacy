"use strict";

var Controller = require("substance-application").Controller;
var Document = require("substance-document");
var EditorView = require("../views/editor");

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
    this.doc = new Document.Controller(this.__document);
    var view = new EditorView(this);
    this.view = view;
    var surface = view.surface;

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


  // Makes the editor the active controller, and thus disabled keybindings
  // for the doc
  //
  // TODO: find a better name

  this.changeFocus = function(view) {
    if (view === this.currentState) return; // Nothing to do here, move along

    this.currentState = view;
    // This is a hack to make the keyboard pull the new app state
    // Oliver: How can we do better?
    window.app.keyboard.stateChanged();
  };

  // Get active controllers
  // --------
  //

  this.getActiveControllers = function() {

    var result = [];
    result.push(["editor", this]);
    if (this.currentState === "writer") {
      result.push(["writer", this.doc]);
    }
    return result;
  };

};

EditorController.Prototype.prototype = Controller.prototype;
EditorController.prototype = new EditorController.Prototype();

module.exports = EditorController;
