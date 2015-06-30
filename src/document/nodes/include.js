var DocumentNode = require('../node');

var Include = DocumentNode.extend({
  name: "include",
  properties: {
    "nodeType": "string",
    "nodeId": "id"
  },
});

Include.static.components = ['nodeId'];

Include.static.blockType = true;

Include.static.matchElement = function($el) {
  return $el.attr('typeof') === 'include';
};

Include.static.fromHtml = function($el, converter) {
  var id = converter.defaultId($el, 'include');
  var inc = {
    id: id,
    nodeId: $el.data('rid'),
    nodeType: $el.data('rtype'),
  };
  return inc;
};

Include.static.toHtml = function(inc, converter) {
  var id = inc.id;
  var $el = $('<div>')
    .attr('id', id)
    .attr('typeof', inc.type)
    .data('rtype', inc.nodeType)
    .data('rid', inc.nodeId);
  return $el;
};

module.exports = Include;