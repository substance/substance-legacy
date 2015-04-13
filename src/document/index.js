'use strict';

var Document = require('./document');

Document.Schema = require('./document_schema');

Document.Node = require('./node');
Document.Annotation = require('./annotation');
Document.Container = require('./container');
Document.ContainerNode = require('./container_node');
Document.ContainerAnnotation = require('./container_annotation');

Document.Coordinate = require('./coordinate');
Document.Range = require('./range');
Document.Selection = require('./selection');
Document.Selection.create = require('./create_selection');
Document.NullSelection = Document.Selection.NullSelection;
Document.nullSelection = Document.Selection.NullSelection;
Document.PropertySelection = require('./property_selection');
Document.ContainerSelection = require('./container_selection');

Document.Annotator = require('./annotator');

Document.HtmlImporter = require('./html_importer');
Document.HtmlExporter = require('./html_exporter');

module.exports = Document;
