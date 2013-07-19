"use strict";

var _ = require("underscore");
var Substance = require("../substance");

var util = Substance.util;
var Chronicle = Substance.Chronicle;
var Document = Substance.Document;

// Substance.Session
// -----------------
//
// The main model thing

var Session = function(env) {
  this.env = env;
};


Session.Prototype = function() {

  // Load document from data folder
  // --------

  this.loadDocument = function(id, cb) {
    $.getJSON("data/"+id+".json", function(data) {
      var doc = Document.fromSnapshot(data, {
        chronicle: Chronicle.create()
      });
      cb(null, doc);
    }).error(cb);
  };
};

Session.prototype = new Session.Prototype();
_.extend(Session.prototype, util.Events);

module.exports = Session;
