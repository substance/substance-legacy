var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var HtmlImporter = require('./html_importer');

// An importer specialized for clipboard HTML
// which supports
// p -> paragraph
// h1,h2,h3,h4,h5 -> heading
// em,i -> emphasis
// strong,b -> strong
// ul,ol -> list
// table -> table
// figure -> figure (?)

var Paragraph = require('./nodes/paragraph');
var Heading = require('./nodes/heading');
var List = require('./nodes/list');
var ListItem = require('./nodes/list_item');
var Table = require('./nodes/table');
var TableSection = require('./nodes/table_section');
var TableRow = require('./nodes/table_row');
var TableCell = require('./nodes/table_cell');
var Emphasis = require('./nodes/emphasis');
var Strong = require('./nodes/strong');
var Link = require('./nodes/link');

function ClipboardImporter() {
  ClipboardImporter.super.call(this);
  _.each(ClipboardImporter.nodeClasses, function(NodeClass) {
    this.defineNodeImporter(NodeClass);
  }, this);
}

ClipboardImporter.Prototype = function() {

  this.convert = function($rootEl, doc) {
    this.initialize(doc, $rootEl);

    var $body = $rootEl.find('body');
    $body = this.sanitizeBody($body);
    this.convertContainer($body, 'main');

    this.finish();
  };

  this.sanitizeBody = function($body) {
    // Look for paragraphs in <b> which is served by GDocs.
    var $gdocs = $body.find('b > p');
    if ($gdocs.length) {
      $body = $($gdocs[0].parentNode);
    }
    $body.find('*[style]').removeAttr('style');
    return $body;
  };
};

OO.inherit(ClipboardImporter, HtmlImporter);

ClipboardImporter.Emphasis = function() {
  ClipboardImporter.Emphasis.super.apply(this, arguments);
};

OO.inherit(ClipboardImporter.Emphasis, Emphasis);

ClipboardImporter.Emphasis.static.matchElement = function($el) {
  return $el.is('em,i');
};

ClipboardImporter.Emphasis.static.toHtml = function(anno, converter, children) {
  return $('<i>').attr('id', anno.id).append(children);
};

ClipboardImporter.Strong = function() {
  ClipboardImporter.Strong.super.apply(this, arguments);
};

OO.inherit(ClipboardImporter.Strong, Strong);

ClipboardImporter.Strong.static.matchElement = function($el) {
  return $el.is('strong,b');
};

ClipboardImporter.Strong.static.toHtml = function(anno, converter, children) {
  return $('<b>').attr('id', anno.id).append(children);
};

ClipboardImporter.nodeClasses =   [
  Paragraph, Heading, List, ListItem,
  Table, TableSection, TableRow, TableCell,
  ClipboardImporter.Emphasis, ClipboardImporter.Strong,
  Link
];

module.exports = ClipboardImporter;
