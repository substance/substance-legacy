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

window.handleDoc = null;

Session.Prototype = function() {

  // Load document from data folder
  // --------

  this.loadDocument = function(id, cb) {
    // this.loadElifeDocument(id, cb);
    $.getJSON("data/"+id+".json", function(data) {
      var doc = Document.fromSnapshot(data, {
        chronicle: Chronicle.create()
      });
      cb(null, doc);
    }).error(cb);
  };

  this.loadElifeDocument = function(url, cb) {

    // Overwrite global reference, so we can access cb
    handleDoc = function(elifeDoc) {
      var doc = new Document({
        id: "elife_"+elifeDoc.id,
        chronicle: Chronicle.create()
      });

      function insert(node) {
        var newNode = _.clone(node);
        newNode.id = newNode.id.replace(':', '_');
        newNode.id = newNode.id.replace('text', 'paragraph');
        if (doc.get(newNode.id)) return; // skip
        doc.create(newNode);
        doc.position('content', [newNode.id], -1);
      }

      _.each(elifeDoc.views["content"], function(nodeId) {
        var node = _.clone(elifeDoc.nodes[nodeId]);
        if (node.type === "heading") {
          insert(node);
        } else if (node.type === "text") {
          node.type = 'paragraph';
          insert(node);
        }
      });

      // Import figures
      _.each(elifeDoc.nodes, function(node) {
        if (node.type === "figure_reference") {
          var imageNode = _.clone(elifeDoc.nodes[node.target]);
          var para = doc.get(node.source.replace('text:', 'paragraph_'));
          imageNode.id = imageNode.id.replace(':', '_')

          if (!doc.get(imageNode.id) && para) {
            doc.create({
              id: imageNode.id,
              type: "image",
              url: imageNode.url,
              content: " "
            });

            var pos = doc.getPosition('content', para.id)
            doc.position("content", [imageNode.id], pos +1);
          }
        }

        if (node.key === 'content' && node.type === "emphasis") {
          console.log('creating', {
            id: node.id.replace(':', '_'),
            type: node.type,
            node: node.source,
            property: 'content',
            range: [node.pos[0], node.pos[0] + node.pos[1]]
          });
          // Create idea annotation
          doc.create({
            id: node.id.replace(':', '_'),
            type: node.type,
            node: node.source,
            property: 'content',
            range: [node.pos[0], node.pos[0] + node.pos[1]]
          });
        }

      });

      // console.log(JSON.stringify(doc.toJSON(), null, '  '));
      cb(null, doc);
    };

    // Example docs
    // 00699, 00311
    // 

    $.ajax({
      type : "GET",
      dataType : "jsonp",
      url : 'http://cdn.elifesciences.org/documents/elife/00311.js',
      jsonpCallback: 'handleDoc',
    });
  };
};

Session.prototype = new Session.Prototype();
_.extend(Session.prototype, util.Events);

module.exports = Session;
