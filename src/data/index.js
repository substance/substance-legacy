'use strict';

var Data = {};

Data.Graph = require('./graph');
Data.IncrementalGraph = require('./incremental_graph');

Data.Node = require('./node');
Data.Schema = require('./schema');
Data.Index = require('./node_index');

module.exports = Data;