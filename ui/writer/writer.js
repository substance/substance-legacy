/* global $ */
"use strict";

var Component = require('../component');
var $$ = Component.$$;

var Substance = require("substance");
var _ = require("substance/helpers");
var ContentTools = require("../content_tools");
var ContentPanel = require("../content_panel");
var WriterControllerMixin = require("./writer_controller_mixin");
var StatusBar = require("./status_bar");

// The Substance Writer Component
// ----------------

var WriterMixin = _.extend({}, WriterControllerMixin, Substance.EventEmitter.prototype, {

  render: function() {
    var ContentToolbar = this.componentRegistry.get('content_toolbar') || ContentTools;
    return $$('div', { className: 'writer-component', onKeyDown: this.handleApplicationKeyCombos},
      $$('div', {className: "main-container"},
        $$(ContentToolbar),
        $$(ContentPanel, {containerId: this.props.contentContainer})
      ),
      $$('div', {className: "resource-container"},
        this.createContextToggles(),
        this.createContextPanel(this)
      ),
      this.createModalPanel(),
      $$(StatusBar, {
        doc: this.props.doc
      }),
      $$('div', {className: "clipboard"})
    );
  },

  // return true when you handled a key combo
  handleApplicationKeyCombos: function(e) {
    // console.log('####', e.keyCode, e.metaKey, e.ctrlKey, e.shiftKey);
    var handled = false;
    // TODO: we could make this configurable via extensions
    // Undo/Redo: cmd+z, cmd+shift+z
    if (e.keyCode === 90 && (e.metaKey||e.ctrlKey)) {
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      handled = true;
    }
    // Reset to default state
    else if (e.keyCode === 27) {
      this.replaceState(this.getInitialState());
      handled = true;
    }
    // Save: cmd+s
    else if (e.keyCode === 83 && (e.metaKey||e.ctrlKey)) {
      this.requestSave();
      handled = true;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
});

// Create React class
var Writer = React.createClass({
  mixins: [WriterMixin],
  displayName: "Writer",
});

module.exports = Writer;