'use strict';

var Node = require('./node');

var Container = Node.extend({

  name: "container",

  properties: {
    // array of node ids
    nodes: ['array', 'string']
  },

  getPosition: function(nodeId) {
    var pos = this.nodes.indexOf(nodeId);
    return pos;
  },

  show: function(nodeId, pos) {
    var doc = this.getDocument();
    pos = pos || this.nodes.length;
    doc.update([this.id, 'nodes'], {
      insert: { offset: pos, value: nodeId }
    });
  },

  hide: function(nodeId) {
    var doc = this.getDocument();
    var pos = this.nodes.indexOf(nodeId);
    if (pos >= 0) {
      doc.update([this.id, 'nodes'], {
        delete: { offset: pos }
      });
    } else {
      console.error('Could not find node with id %s.', nodeId);
    }
  },

});

module.exports = Container;