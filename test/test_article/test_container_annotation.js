'use strict';

var Document = require('../../src/document');

var TestContainerAnnotation = Document.ContainerAnnotation.extend({
  name: 'test-container-anno',
});

module.exports = TestContainerAnnotation;