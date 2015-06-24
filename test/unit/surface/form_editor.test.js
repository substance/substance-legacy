"use strict";

require('../init');
var sample1 = require('../../fixtures/sample1');
var Document = require('../../../src/document');
var Surface = require('../../../src/surface');
var FormEditor = Surface.FormEditor;
var Selection = Document.Selection;

QUnit.module('Unit/Substance.Surface/FormEditor');

QUnit.test("insertText", function(assert) {
  var doc = sample1();
  var editor = new FormEditor(doc);
  var sel = Selection.create(['p1', 'content'], 4);
  var state = {selection: sel};
  editor.insertText('test', state);
  assert.equal(doc.get(['p1', 'content']), 'Paratestgraph 1', 'Text should be inserted.');
  assert.equal(state.selection.start.offset, 8, 'selection should be updated.');
  assert.ok(state.selection.isCollapsed(), 'selection should be collapsed.');
});

QUnit.test("insertText (write over)", function(assert) {
  var doc = sample1();
  var editor = new FormEditor(doc);
  var sel = Selection.create(['p1', 'content'], 4, 9);
  var state = {selection: sel};
  editor.insertText('test', state);
  assert.equal(doc.get(['p1', 'content']), 'Paratest 1', 'Text should be overwritten.');
  assert.equal(state.selection.start.offset, 8, 'selection should be updated.');
  assert.ok(state.selection.isCollapsed(), 'selection should be collapsed.');
});

QUnit.test("insertText before annotation", function(assert) {
  var doc = sample1();
  var editor = new FormEditor(doc);
  var sel = Selection.create(['p2', 'content'], 4);
  var state = {selection: sel};
  editor.insertText('test', state);
  var anno = doc.get('em1');
  assert.equal(anno.startOffset, 19, 'Annotation startOffset should be shifted.');
  assert.equal(anno.endOffset, 29, 'Annotation endOffset should be shifted.');
});

QUnit.test("insertText at left annotation boundary", function(assert) {
  var doc = sample1();
  var editor = new FormEditor(doc);
  var sel = Selection.create(['p2', 'content'], 15);
  var state = {selection: sel};
  editor.insertText('test', state);
  var anno = doc.get('em1');
  assert.equal(anno.startOffset, 19, 'Annotation startOffset should not be expanded but be shifted.');
});

QUnit.test("insertText into annotation range", function(assert) {
  var doc = sample1();
  var editor = new FormEditor(doc);
  var sel = Selection.create(['p2', 'content'], 17);
  var state = {selection: sel};
  editor.insertText('test', state);
  var anno = doc.get('em1');
  assert.equal(anno.startOffset, 15, 'Annotation startOffset should not be changed.');
  assert.equal(anno.endOffset, 29, 'Annotation endOffset should be shifted.');
});

QUnit.test("insertText at right annotation boundary", function(assert) {
  var doc = sample1();
  var editor = new FormEditor(doc);
  var sel = Selection.create(['p2', 'content'], 25);
  var state = {selection: sel};
  editor.insertText('test', state);
  var anno = doc.get('em1');
  assert.equal(anno.endOffset, 29, 'Annotation endOffset should be expanded.');
});
