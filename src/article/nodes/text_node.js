var ContentNode = require('./content_node');

var TextNode = ContentNode.extend({
  name: "text"
});

module.exports = TextNode;