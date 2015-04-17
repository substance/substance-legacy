var Substance = require('../../basics');
var Document = require('../../document');

var Paragraph = Document.TextNode.extend({
  name: "paragraph"
});

// Html import
// -----------

Paragraph.static.blockType = true;

Paragraph.static.matchElement = function(el) {
  var tagName = el.tagName.toLowerCase();
  return (tagName === 'p');
};

Paragraph.static.fromHtml = function(el, converter) {
  var paragraph = {
    id: el.dataset.id || Substance.uuid('paragraph'),
    content: ''
  };
  paragraph.content = converter.annotatedText(el, [paragraph.id, 'content']);
  return paragraph;
};

module.exports = Paragraph;
