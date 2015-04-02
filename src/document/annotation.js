'use strict';

var Node = require('./node');

var Annotation = Node.extend({
  name: "annotation",

  properties: {
    path: ['array', 'string'],
    range: ['array', 'number']
  },

  canSplit: function() {
    return true;
  }
});

module.exports = Annotation;
