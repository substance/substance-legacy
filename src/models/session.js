(function(root) {

var Substance = root.Substance;
var util = Substance.util;
var _ = root._;
var Data = Substance.Data;
var Chronicle = Substance.Chronicle;
var Document = Substance.Document;
var Test = Substance.Test;


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

Substance.Session = Session;

})(this);
