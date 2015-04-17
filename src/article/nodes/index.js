var DocumentNode = require("./document_node");
var Strong = require("./strong");
var Emphasis = require("./emphasis");
var Reference = require("./reference");
var initialize = require("./initialize");

module.exports = {
  nodes: [DocumentNode, Reference, Strong, Emphasis],
  initialize: initialize
};