"use strict";

require('../../init');
var sample1 = require('../../../fixtures/sample1');
var Document = require('../../../../src/document');
var deleteSelection = require('../../../../src/document/transformations/delete_selection');
var Selection = Document.Selection;

QUnit.module('Unit/Substance.Document/Transformations/DeleteSelection');

QUnit.test("delete property selection", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p2', 'content'], 10, 15);
  var state = {selection: sel};
  deleteSelection(doc, {}, state);
  assert.equal(doc.get(['p2', 'content']), 'Paragraph annotation', 'Selected text should be deleted.');
});

QUnit.test("delete property selection before annotation", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p2', 'content'], 0, 4);
  var state = {selection: sel};
  var anno = doc.get('em1');
  var oldStartOffset = anno.startOffset;
  var oldEndOffset = anno.endOffset;
  deleteSelection(doc, {}, state);
  assert.equal(anno.startOffset, oldStartOffset-4, 'Annotation start should be shifted left.');
  assert.equal(anno.endOffset, oldEndOffset-4, 'Annotation end should be shifted left.');
});

QUnit.test("delete property selection overlapping annotation start", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p2', 'content'], 10, 20);
  var state = {selection: sel};
  var anno = doc.get('em1');
  var oldStartOffset = anno.startOffset;
  var oldEndOffset = anno.endOffset;
  deleteSelection(doc, {}, state);
  assert.equal(anno.startOffset, 10, 'Annotation start should be shifted left.');
  assert.equal(anno.endOffset, 15, 'Annotation end should be shifted left.');
});

QUnit.test("delete property selection overlapping annotation end", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p2', 'content'], 20, 30);
  var state = {selection: sel};
  var anno = doc.get('em1');
  var oldStartOffset = anno.startOffset;
  var oldEndOffset = anno.endOffset;
  deleteSelection(doc, {}, state);
  assert.equal(anno.startOffset, 15, 'Annotation start should not change.');
  assert.equal(anno.endOffset, 20, 'Annotation end should be shifted left.');
});
