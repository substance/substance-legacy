var Annotation = require('../annotation');

var Emphasis = Annotation.extend({
  name: "emphasis",

  splitContainerSelections: true
});

Emphasis.static.tagName = "em";

Emphasis.static.matchElement = function($el) {
  return $el.is(Emphasis.static.tagName);
};

module.exports = Emphasis;
