var Data = require('../../data');

function initialize(doc) {
  doc.references = doc.addIndex('referenceByTarget', Data.Index.create({
    type: "reference",
    property: "target"
  }));
}

module.exports = initialize;
