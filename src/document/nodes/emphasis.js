var Annotation = require('../annotation');

var Emphasis = Annotation.extend({
  name: "emphasis",

  splitContainerSelections: true
});

Emphasis.static.tagName = "em";

Emphasis.static.matchElement = function($el) {
  return $el.is("em,i");
};

Emphasis.static.level = Number.MAX_VALUE;

module.exports = Emphasis;
