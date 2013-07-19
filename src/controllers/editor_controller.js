(function(root) {

var Substance = root.Substance;
var util = Substance.util;
var _ = root._;
var Controller = Substance.Application.Controller;
var Data = Substance.Data;
var Chronicle = Substance.Chronicle;
var Document = Substance.Document;
var Session = Substance.Session;
var Operator = Substance.Operator;
var Test = Substance.Test;

// Substance Editor Component
// =============================================

var Editor = Substance.Editor || {};

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

Editor.Controller = EditorController;
Substance.Editor = Editor;

})(this);
