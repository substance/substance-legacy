var de = require('../document_engine');
var sys = require('sys');
var assert = require('assert');
var vows = require('vows@0.5.2');

var g = new de.DocumentGraph();

// Create a Test Suite
vows.describe('DocumentGraph').addBatch({
  'when instanciating a DocumentGraph': {
    topic: function () { return new de.DocumentGraph(); },
    'should be valid': function (graph) {
      // assert.ok(graph, Infinity);
      assert.ok(graph instanceof de.DocumentGraph)
    },
    'calling nodes()': {
      topic: function (graph) { return graph.nodes() },
      'should return the object with id 42': function (graph) {
        assert.equal (graph, 'all the nodes for you');
      }
    }
  }
}).run(); // Run it
