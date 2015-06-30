var OO = require('../basics/oo');
var ClipboardImporter = require('./clipboard_importer');
var HtmlExporter = require('./html_exporter');

function ClipboardExporter() {
  ClipboardExporter.super.call(this);
}

ClipboardExporter.Prototype = function() {

  this.getNodeConverter = function(node) {
    switch(node.type) {
      case 'emphasis':
        return ClipboardImporter.Emphasis;
      case 'strong':
        return ClipboardImporter.Strong;
      default:
        return node.constructor;
    }
  };

  this.convert = function(doc, options) {
    this.initialize(doc, options);
    var $doc = this.createHtmlDocument();
    // Note: the content of a clipboard document
    // is coming as container with id 'clipboard'
    var content = doc.get('content');
    $doc.find('body').append(this.convertContainer(content));

    return $doc.html();
  };

};

OO.inherit(ClipboardExporter, HtmlExporter);

module.exports = ClipboardExporter;
