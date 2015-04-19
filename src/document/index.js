'use strict';

var Document = require('./document');

Document.Schema = require('./document_schema');

Document.Node = require('./node');
Document.Annotation = require('./annotation');
Document.Container = require('./container');
Document.ContainerNode = require('./container_node');
Document.ContainerAnnotation = require('./container_annotation');
Document.TextNode = require('./text_node');

Document.Coordinate = require('./coordinate');
Document.Range = require('./range');
Document.Selection = require('./selection');
Document.Selection.create = require('./create_selection');
Document.nullSelection = Document.Selection.nullSelection;
Document.PropertySelection = require('./property_selection');
Document.ContainerSelection = require('./container_selection');

Document.Annotator = require('./annotator');
Document.AnnotationUpdates = require('./annotation_updates');

Document.HtmlImporter = require('./html_importer');
Document.HtmlExporter = require('./html_exporter');

module.exports = Document;
