'use strict';

var Node = require('./node');

var Container = Node.extend({

  name: "container",

  properties: {
    // array of node ids
    nodes: ['array', 'string']
  },

});

module.exports = Container;