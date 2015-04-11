"use strict";

var Substance = require('substance');
var Document = Substance.Document;

var CoreModule = require("./nodes");
var Reference = require("./nodes/reference");

var Article = function(data) {
  var schema = new Document.Schema("substance-article", "1.0.0");

  schema.addNodes(CoreModule.nodes);
  Document.call(this, schema, data);
  CoreModule.initialize(this);
};

Article.Prototype = function() {};
Article.CoreModule = CoreModule;

Article.nodes = {};
Article.nodes.Reference = Reference;

Substance.inherit(Article, Document);
module.exports = Article;
