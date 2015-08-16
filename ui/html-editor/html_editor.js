'use strict';

var _ = require("../../basics/helpers");
var OO = require("../../basics/oo");
var Component = require('../component');
var Surface = require('../../surface');
var Registry = require('../../basics/registry');

var ToolComponent = require('../tools/tool_component');
var TextToolComponent = require('../tools/text_tool_component');
var ContainerComponent = require('../nodes/container_node_component');
var ParagraphComponent = require('../nodes/paragraph_component');
var HeadingComponent = require('../nodes/heading_component');

var HtmlArticle = require("./html_article");
var DefaultToolbar = require('./default_toolbar');

var $$ = Component.$$;
var Clipboard = Surface.Clipboard;
var SurfaceManager = Surface.SurfaceManager;
var ContainerEditor = Surface.ContainerEditor;

var components = {
  "paragraph": ParagraphComponent,
  "heading": HeadingComponent
};

var tools = Surface.Tools;

// HtmlEditor
// ----------------
//
// A simple rich text editor implementation based on Substance

function HtmlEditor() {
  Component.apply(this, arguments);

  // Document instance
  this.doc = HtmlArticle.fromHtml(this.props.content);

  // Editing Surface
  this.surfaceManager = new SurfaceManager(this.doc);
  this.clipboard = new Clipboard(this.surfaceManager, this.doc.getClipboardImporter(), this.doc.getClipboardExporter());
  this.editor = new ContainerEditor('body');

  // Component registry
  this.componentRegistry = new Registry();
  _.each(components, function(ComponentClass, name) {
    this.componentRegistry.add(name, ComponentClass);
  }, this);

  // Tool registry
  this.toolRegistry = new Registry();
  _.each(tools, function(ToolClass) {
    this.toolRegistry.add(ToolClass.static.name, new ToolClass());
  }, this);

  // Dependency Injection
  this.childContext = {
    componentRegistry: this.componentRegistry,
    toolRegistry: this.toolRegistry,
    surfaceManager: this.surfaceManager
  };
}

HtmlEditor.Prototype = function() {

  this.render = function() {
    var el = $$('div').addClass('html-editor-component');
    if (this.props.toolbar) {
      var toolbar;
      if (this.props.toolbar === "default") {
        toolbar = $$(DefaultToolbar);
      } else {
        toolbar = $$(this.props.toolbar);
      }
      toolbar.key('toolbar');
      el.append(toolbar);
    }
    el.append($$(ContainerComponent)
      .key('bodyContainer')
      .attr({ contentEditable: true })
      .addProps({
        doc: this.doc,
        node: this.doc.get('body'),
        editor: this.editor
      })
    );
    return el;
  };

  this.didReceiveProps = function() {
    if (this.doc.toHtml() !== this.props.content) {
      this.doc.loadHtml(this.props.content);
    }
  };

  this.didMount = function() {
    this.surfaceManager.on('selection:changed', this.onSelectionChanged, this);
    this.clipboard.attach(this.$el[0]);
  };

  this.willUnmount = function() {
    this.dispose();
  };

  this.dispose = function() {
    var clipboard = this.clipboard;
    var surfaceManager = this.surfaceManager;
    if (clipboard) clipboard.detach(this.$el[0]);
    if (surfaceManager) surfaceManager.dispose();
  };

  this.getContent = function() {
    return this.doc.toHtml();
  };

  this.onSelectionChanged = function(sel, surface) {
    this.toolRegistry.each(function(tool) {
      tool.update(surface, sel);
    }, this);
  };

};

OO.inherit(HtmlEditor, Component);

// Expose some more useful components
HtmlEditor.ToolComponent = ToolComponent;
HtmlEditor.TextToolComponent = TextToolComponent;

module.exports = HtmlEditor;
