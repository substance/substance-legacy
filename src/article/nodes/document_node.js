var Document = require('../../document');

var DocumentNode = Document.Node.extend({
  name: "document",
  properties: {
    "guid": "string",
    "creator": "string",
    "title": "string",
    "abstract": "string"
  }
});

module.exports = DocumentNode;