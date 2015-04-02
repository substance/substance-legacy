'use strict';

var Document = require('./document');

Document.Schema = require('./document_schema');

Document.Node = require('./node');
Document.Annotation = require('./annotation');
Document.ContainerNode = require('./container_node');

Document.Selection = require('./selection');
Document.Coordinate = require('./coordinate');
Document.Range = require('./range');
Document.NullSelection = Document.Selection.NullSelection;
Document.PropertySelection = require('./property_selection');
Document.ContainerSelection = require('./container_selection');

module.exports = Document;
