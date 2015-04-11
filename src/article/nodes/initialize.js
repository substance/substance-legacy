var Substance = require('substance');

function initialize(doc) {
  doc.references = doc.addIndex('referenceByTarget', Substance.Data.Index.create({
    type: "reference",
    property: "target"
  }));
}

module.exports = initialize;
