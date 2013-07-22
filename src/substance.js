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
  RegExp: require("substance-regexp"),
  Surface: require("substance-surface")
};

require("substance-operator/tests");
require("substance-chronicle/tests");
require("substance-data/tests");
require("substance-document/tests");
require("substance-surface/tests");

module.exports = Substance;
