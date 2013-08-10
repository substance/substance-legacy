"use strict";

var _ = require("underscore");

var Substance = {
  util: require("substance-util"),
  Test: require("substance-test"),
  Application: require("substance-application"),
  Commander: require("substance-commander"),
  Operator: require("substance-operator"),
  Chronicle: require("substance-chronicle"),
  Data: require("substance-data"),
  Document: require("substance-document"),
  Article: require("substance-article"),
  RegExp: require("substance-regexp"),
  Surface: require("substance-surface")
};

// Register node types
// TODO: that should be done smarter
Substance.Document.Transformer.nodeTypes = {
  "node": require('substance-article/nodes/node'),
  "constructor": require('substance-article/nodes/constructor'),
  "paragraph": require('substance-article/nodes/paragraph'),
  "heading": require('substance-article/nodes/heading'),
  "image": require('substance-article/nodes/image'),
  "codeblock": require('substance-article/nodes/codeblock')
};

require("substance-operator/tests");
require("substance-chronicle/tests");
require("substance-data/tests");
require("substance-document/tests");
//require("substance-article/tests");
require("substance-store/tests");
// require("substance-surface/tests");

module.exports = Substance;
