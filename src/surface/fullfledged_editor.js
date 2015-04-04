'use strict';

var Substance = require('../basics');
var Document = require('../document');
var FormEditor = require('./form_editor');

function FullfledgedEditor(containerNode) {
  FormEditor.call(this, containerNode);
  this.containerNode = containerNode;
}

FullfledgedEditor.Prototype = function() {
};

Substance.inherit(FullfledgedEditor, FormEditor);

module.exports = FullfledgedEditor;