"use strict";

var _ = require('../../basics/helpers');
var OO = require('../../basics/oo');
var Component = require('../component');
var $$ = Component.$$;
var Panel = require('./panel');

function TocPanel() {
  Panel.apply(this, arguments);

  this.handleClick = this.handleClick.bind(this);
}

TocPanel.Prototype = function() {

  this.didMount = function() {
    var doc = this.getDocument();
    doc.connect(this, {
      'app:toc-entry:changed': this.setActiveTOCEntry,
      'document:changed': this.handleDocumentChange
    });
  };

  this.willUnmount = function() {
    var doc = this.getDocument();
    doc.disconnect(this);
  };

  this.getInitialState = function() {
    var doc = this.props.doc;
    var tocNodes = doc.getTOCNodes();
    return {
      tocNodes: tocNodes,
      activeNode: tocNodes.length > 0 ? tocNodes[0].id : null
    };
  };

  this.handleDocumentChange = function(change) {
    var doc = this.getDocument();
    var needsUpdate = false;
    var tocTypes = doc.getSchema().getTocTypes();
    // HACK: this is not totally correct but works.
    // Actually, the TOC should be updated if tocType nodes
    // get inserted or removed from the container, plus any property changes
    // This implementation just checks for changes of the node type
    // not the container, but as we usually create and show in
    // a single transaction this works.
    for (var i = 0; i < change.ops.length; i++) {
      var op = change.ops[i];
      var nodeType;
      if (op.isCreate() || op.isDelete()) {
        var nodeData = op.getValue();
        nodeType = nodeData.type;
        if (_.includes(tocTypes, nodeType)) {
          needsUpdate = true;
          break;
        }
      } else {
        var id = op.path[0];
        var node = doc.get(id);
        if (node && _.includes(tocTypes, node.type)) {
          needsUpdate = true;
          break;
        }
      }
    }
    if (needsUpdate) {
      return this.setState({
       tocNodes: doc.getTOCNodes()
      });
    }
  };

  this.setActiveTocEntry = function(nodeId) {
    this.setState({
      activeNode: nodeId
    });
  };

  this.handleClick = function(e) {
    var nodeId = e.currentTarget.dataset.id;
    console.log('clicked', nodeId);
    e.preventDefault();
    var doc = this.getDocument();
    doc.emit("toc:entry-selected", nodeId);
  };

  this.getClassNames = function() {
    return "panel toc-panel-component";
  };

  this.render = function() {
    var state = this.state;
    var tocEntries = _.map(state.tocNodes, function(node) {
      var level = node.level;
      var classNames = ["toc-entry", "level-"+level];

      if (state.activeNode === node.id) {
        classNames.push("active");
      }

      return $$('a', {
        className: classNames.join(" "),
        href: "#",
        key: node.id,
        "data-id": node.id,
        onClick: this.handleClick
      }, node.content);
    }, this);

    return $$("div", {classNames: "toc-entries"}, tocEntries);
  };
};

OO.inherit(TocPanel, Panel);

// Panel Configuration
// -----------------

TocPanel.contextId = "toc";
TocPanel.icon = "fa-align-left";

module.exports = TocPanel;
