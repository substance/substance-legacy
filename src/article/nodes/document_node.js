var Substance = require('substance');

var DocumentNode = Substance.Document.Node.extend({
  name: "document",
  properties: {
    "guid": "string",
    "creator": "string",
    "title": "string",
    "abstract": "string"
  }
});

module.exports = DocumentNode;