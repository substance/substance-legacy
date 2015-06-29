"use strict";

require('../../init');
var sample1 = require('../../../fixtures/sample1');
var Document = require('../../../../src/document');
var deleteCharacter = Document.Transformations.deleteCharacter;

QUnit.module('Unit/Substance.Document/Transformations/deleteCharacter');

QUnit.test("backspace", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, direction: 'left'};
  deleteCharacter(doc, args);
  assert.equal(doc.get(['p2', 'content']), 'Pargraph with annotation', 'Character should be deleted.');
});

QUnit.test("delete", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 4
  });
  var args = {selection: sel, direction: 'right'};
  deleteCharacter(doc, args);
  assert.equal(doc.get(['p2', 'content']), 'Pararaph with annotation', 'Character should be deleted.');
});
