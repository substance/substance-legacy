"use strict";

require('../../init');
var sample1 = require('../../../fixtures/sample1');
var Document = require('../../../../src/document');
var insertText = require('../../../../src/document/transformations/insert_text');
var Selection = Document.Selection;

QUnit.module('Unit/Substance.Document/Transformations/InsertText');

QUnit.test("insert text at cursor position", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p1', 'content'], 4);
  var state = {selection: sel};
  insertText(doc, { text: 'test' }, state);
  assert.equal(doc.get(['p1', 'content']), 'Paratestgraph 1', 'Text should be inserted.');
  assert.equal(state.selection.start.offset, 8, 'selection should be updated.');
  assert.ok(state.selection.isCollapsed(), 'selection should be collapsed.');
});

QUnit.test("writer over an expanded property selection", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p1', 'content'], 4, 9);
  var state = {selection: sel};
  insertText(doc, { text: 'test' }, state);
  assert.equal(doc.get(['p1', 'content']), 'Paratest 1', 'Text should be overwritten.');
  assert.equal(state.selection.start.offset, 8, 'selection should be updated.');
  assert.ok(state.selection.isCollapsed(), 'selection should be collapsed.');
});

QUnit.test("insert text before annotation", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p2', 'content'], 4);
  var state = {selection: sel};
  insertText(doc, { text: 'test' }, state);
  var anno = doc.get('em1');
  assert.equal(anno.startOffset, 19, 'Annotation startOffset should be shifted.');
  assert.equal(anno.endOffset, 29, 'Annotation endOffset should be shifted.');
});

QUnit.test("insert text at left annotation boundary", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p2', 'content'], 15);
  var state = {selection: sel};
  insertText(doc, { text: 'test' }, state);
  var anno = doc.get('em1');
  assert.equal(anno.startOffset, 19, 'Annotation startOffset should not be expanded but be shifted.');
});

QUnit.test("insert text into annotation range", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p2', 'content'], 17);
  var state = {selection: sel};
  insertText(doc, { text: 'test' }, state);
  var anno = doc.get('em1');
  assert.equal(anno.startOffset, 15, 'Annotation startOffset should not be changed.');
  assert.equal(anno.endOffset, 29, 'Annotation endOffset should be shifted.');
});

QUnit.test("insert text at right annotation boundary", function(assert) {
  var doc = sample1();
  var sel = Selection.create(['p2', 'content'], 25);
  var state = {selection: sel};
  insertText(doc, { text: 'test' }, state);
  var anno = doc.get('em1');
  assert.equal(anno.endOffset, 29, 'Annotation endOffset should be expanded.');
});
