"use strict";

require('../../init');
var sample1 = require('../../../fixtures/sample1');
var Document = require('../../../../src/document');
var deleteSelection = Document.Transformations.deleteSelection;

QUnit.module('Unit/Substance.Document/Transformations/deleteSelection');

QUnit.test("delete property selection", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 10,
    endOffset: 15
  });
  var args = {selection: sel};
  deleteSelection(doc, args);
  assert.equal(doc.get(['p2', 'content']), 'Paragraph annotation', 'Selected text should be deleted.');
});

QUnit.test("delete property selection before annotation", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 0,
    endOffset: 4
  });
  var anno = doc.get('em1');
  var oldStartOffset = anno.startOffset;
  var oldEndOffset = anno.endOffset;
  var args = {selection: sel};
  deleteSelection(doc, args);
  assert.equal(anno.startOffset, oldStartOffset-4, 'Annotation start should be shifted left.');
  assert.equal(anno.endOffset, oldEndOffset-4, 'Annotation end should be shifted left.');
});

QUnit.test("delete property selection overlapping annotation start", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 10,
    endOffset: 20
  });
  var anno = doc.get('em1');
  var args = {selection: sel};
  deleteSelection(doc, args);
  assert.equal(anno.startOffset, 10, 'Annotation start should be shifted left.');
  assert.equal(anno.endOffset, 15, 'Annotation end should be shifted left.');
});

QUnit.test("delete property selection overlapping annotation end", function(assert) {
  var doc = sample1();
  var sel = doc.createSelection({
    type: 'property',
    path: ['p2', 'content'],
    startOffset: 20,
    endOffset: 30
  });
  var anno = doc.get('em1');
  var args = {selection: sel};
  deleteSelection(doc, args);
  assert.equal(anno.startOffset, 15, 'Annotation start should not change.');
  assert.equal(anno.endOffset, 20, 'Annotation end should be shifted left.');
});
