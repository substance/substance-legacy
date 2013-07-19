"use strict";

var _ = require("underscore");

var Substance = {
  util: require("./lib/util"),
  Test: require("./lib/test"),
  Application: require("./lib/application"),
  Commander: require("./lib/commander"),
  Operator: require("./lib/operator"),
  Chronicle: require("./lib/chronicle"),
  Data: require("./lib/data"),
  Document: require("./lib/document"),
  Library: require("./lib/library"),
  RegExp: require("./lib/regexp"),
  Store: require("./lib/store"),
  Surface: require("./lib/surface")
};

require("./lib/operator/tests");
require("./lib/chronicle/tests");
require("./lib/data/tests");
require("./lib/document/tests");
require("./lib/surface/tests");

module.exports = Substance;
