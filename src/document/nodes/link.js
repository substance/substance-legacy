var Annotation = require('../annotation');

var Link = Annotation.extend({
  name: "link",

  properties: {
    url: 'string'
  }
});

// HtmlImporter

Link.static.tagName = 'a';

Link.static.matchElement = function($el) {
  return $el.is('a');
};

Link.static.fromHtml = function($el, converter) {
  var link = {
    url: $el.attr('href')
  };
  // Note: we need to call back the converter
  // that it can process the element's inner html.
  // We do not need it for the link itself, though
  // TODO: maybe it is possible to detect if it has called back
  converter.annotatedText($el);
  return link;
};

Link.static.toHtml = function(link, converter, children) {
  var $el = Annotation.static.toHtml(link, converter, children);
  $el.attr('href', link.url);
  return $el;
};

module.exports = Link;
