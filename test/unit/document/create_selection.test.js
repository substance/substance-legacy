var Document = require('../../../src/document');

var Selection = Document.Selection;

QUnit.module('Unit/Substance.Document/create_selection');

QUnit.test( "Create property selection for (path, offset)", function( assert ) {
  var sel =  Selection.create(['test'], 1);
  assert.ok( sel.isPropertySelection(), "Should create property selection for (path, offset)." );
});
