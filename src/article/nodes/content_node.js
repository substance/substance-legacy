'use strict';

var Substance = require('substance');

var ContentNode = Substance.Document.Node.extend({
  name: "content",
  properties: {
    content: "string"
  }
});

module.exports = ContentNode;