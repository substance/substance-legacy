"use strict";

require('../../init');
var sample1 = require('../../../fixtures/sample1');
var deleteCharacter = require('../../../../src/document/transformations/delete_character');

QUnit.module('Unit/Substance.Document/Transformations/deleteCharacter');

QUnit.test("backspace", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var state = {selection: sel};
  deleteCharacter(doc, { direction: 'left' }, state);
  assert.equal(doc.get(['p2', 'content']), 'Pargraph with annotation', 'Character should be deleted.');
});

QUnit.test("delete", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var state = {selection: sel};
  deleteCharacter(doc, { direction: 'right' }, state);
  assert.equal(doc.get(['p2', 'content']), 'Pararaph with annotation', 'Character should be deleted.');
});
