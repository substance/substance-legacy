"use strict";

var Substance = require('../basics');
var Document = require('../document');

var CoreModule = require("./nodes");
var Reference = require("./nodes/reference");

var schema = new Document.Schema("substance-article", "1.0.0");
schema.addNodes(CoreModule.nodes);

var Article = function(data) {
  Document.call(this, schema, data);
  CoreModule.initialize(this);
};

// Don't do that here, it is application level stuff
// you could provide such a module in writer instead
// Also remember, that this is not 'core', it is substance-article specific
Article.CoreModule = CoreModule;

Article.nodes = {};
Article.nodes.Reference = Reference;

Substance.inherit(Article, Document);

Article.schema = schema;

// TODO: it is not clear how this should be done
// IMO it is not very useful to extend the Article, so it should be enough
// to expose certain nodes so that other implementations can use them.
Article.Paragraph = require('./nodes/paragraph');

module.exports = Article;
