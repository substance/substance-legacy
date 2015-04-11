var Substance = require('substance');

var DocumentNode = Substance.Document.Node.extend({
  name: "document",
  properties: {
    "guid": "string",
    "creator": "string",
    "title": "string", // TODO: remove
    "abstract": "string",
    "interview_subject_name": "string",
    "interview_subject_bio": "string"
  }
});

module.exports = DocumentNode;