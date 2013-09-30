"use strict";

var _ = require("underscore");
var Controller = require("substance-application").Controller;
var LibraryView = require("../views/library");
var util = require("substance-util")


// Substance.Sandbox.Controller
// -----------------
//
// Main Application Controller

var LibraryController = function(library) {

  this.library = library;
  Controller.call(this);

  // Create library view
  this.view = new LibraryView(this);
};


LibraryController.Prototype = function() {


  this.createView = function() {
    // this.writer = new Document.Writer(this.__document);
    var view = new LibraryView(this);

    return view;
  };

  // Transitions
  // ==================================



  // Provides an array of (context, controller) tuples that describe the
  // current state of responsibilities
  // --------
  //
  // E.g., when a document is opened:
  //    ["application", "document"]
  // with controllers taking responisbility:
  //    [this, this.document]
  //
  // The child controller (e.g., document) should itself be allowed to have sub-controllers.
  // For sake of prototyping this is implemented manually right now.
  // TODO: discuss naming

  this.getActiveControllers = function() {
    var result = [ ["sandbox", this] ];

    var state = this.state;

    if (state === "editor") {
      result = result.concat(this.editor.getActiveControllers());
    } else if (state === "test_center") {
      result.push(["test_center", this.testRunner]);
    }
    return result;
  };

  // Returns active collection
  // --------

  this.getCollection = function() {
    return {
      name: "Example documents",
      documents: [
        {
          id: "introduction",
          title: "Substance Introduction (Draft)"
        },
        {
          id: "handbook",
          title: "Substance Handbook (Draft)"
        },
        {
          id: "lorem_ipsum",
          title: "Lorem Ipsum (Demo doc)"
        }
        // {
        //   id: "lorem_ipsum",
        //   title: "Lorem Ipsum"
        // },
        // {
        //   id: encodeURIComponent("https://raw.github.com/substance/docs/master/introduction.md"),
        //   title: "Substance Introduction (Draft)"
        // },
        // {
        //   id: encodeURIComponent("https://raw.github.com/substance/docs/master/handbook.md"),
        //   title: "Substance Handbook (Draft)"
        // },
        // {
        //   id: "elife_00311",
        //   title: "Modelling dynamics in protein crystal structures by ensemble refinement"
        // },
        // {
        //   id: "elife_00845",
        //   title: "Dynamin phosphorylation controls optimization of endocytosis for brief action potential bursts"
        // },
        // {
        //   id: "elife_00762",
        //   title: "A mammalian pseudogene lncRNA at the interface of inflammation and anti-inflammatory therapeutics"
        // }
      ]
    }
  };
};


// Exports
// --------

LibraryController.Prototype.prototype = Controller.prototype;
LibraryController.prototype = new LibraryController.Prototype();
_.extend(LibraryController.prototype, util.Events);


module.exports = LibraryController;
