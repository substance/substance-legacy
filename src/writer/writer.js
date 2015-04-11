/* global $ */
var $$ = React.createElement;

var Substance = require("substance");
var ContentTools = require("./content_tools");
var ContentPanel = require("./content_panel");
var WriterController = require("./writer_controller");

var StatusBar = require("./status_bar");

// The Substance Writer Component
// ----------------

var Writer = React.createClass({
  displayName: "Writer",

  contextTypes: {
    backend: React.PropTypes.object.isRequired,
    notifications: React.PropTypes.object.isRequired
  },

  childContextTypes: {
    // used by text properties to render 'active' annotations
    // For active container annotations annotation fragments are inserted
    // which can be used to highlight the associated range
    getHighlightedNodes: React.PropTypes.func,
    getActiveContainerAnnotations: React.PropTypes.func
  },

  getChildContext: function() {
    return {
      getHighlightedNodes: this.getHighlightedNodes,
      getActiveContainerAnnotations: this.getActiveContainerAnnotations,
    };
  },

  getInitialState: function() {
    return {"contextId": "entities"};
  },

  // Events
  // ----------------

  componentWillMount: function() {
    // Initialize writer controller, which will serve as a common interface
    // for custom modules
    this.writerCtrl = new WriterController({
      doc: this.props.doc,
      writerComponent: this,
      config: this.props.config
    });
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    var sprevState = JSON.stringify(this.state);
    var snextState = JSON.stringify(nextState);
    if (Substance.isEqual(sprevState, snextState)) {
      return false;
    }
    return true;
  },

  componentDidMount: function() {
    if (!window.devMode) {
      setInterval(function() {
        this.requestAutoSave();
      }.bind(this), 10000);
    }
  },

  requestAutoSave: function() {
    var doc = this.props.doc;
    var backend = this.context.backend;
    var notifications = this.context.notifications;

    if (doc.__dirty && !doc.__isSaving) {

      notifications.addMessage({
        type: "info",
        message: "Autosaving ..."
      });

      doc.__isSaving = true;
      backend.saveDocument(doc, function(err) {
        doc.__isSaving = false;
        if (err) {
          notifications.addMessage({
            type: "error",
            message: err.message || err.toString()
          });
          console.err('saving of document failed');
        } else {
          doc.emit('document:saved');
          notifications.addMessage({
            type: "info",
            message: "No changes"
          });
          doc.__dirty = false;
        }
      });
    }
  },

  // E.g. when a tool requests a context switch
  handleContextSwitch: function(contextId) {
    this.replaceState({
      contextId: contextId
    });
  },

  handleCloseDialog: function() {
    console.log('handling close');
    this.replaceState(this.getInitialState());
  },

  // Triggered by Writer UI
  handleContextToggle: function(e) {
    e.preventDefault();
    var newContext = $(e.currentTarget).attr("data-id");
    this.handleContextSwitch(newContext);
  },

  // Rendering
  // ----------------

  // Toggles for explicitly switching between context panels
  createContextToggles: function() {
    var panels = this.writerCtrl.getPanels();
    var contextId = this.state.contextId;
    var self = this;

    var panelComps = panels.map(function(panelClass) {
      // We don't show inactive here
      if (panelClass.isDialog && panelClass.contextId !== contextId) return null;

      var className = ["toggle-context"];
      if (panelClass.contextId === contextId) {
        className.push("active");
      }

      if (panelClass.isDialog) {
        return $$('div', {
          className: 'dialog '+ contextId,
          href: "#",
          key: panelClass.contextId,
          "data-id": panelClass.contextId
        },
          panelClass.displayName,
          $$('a', {
            href: "#",
            onClick: this.handleCloseDialog,
            className: "close-dialog",
            dangerouslySetInnerHTML: {__html: '<i class="fa fa-close"></i> '}
          })
        );
      } else {
        return $$('a', {
          className: className.join(" "),
          href: "#",
          key: panelClass.contextId,
          "data-id": panelClass.contextId,
          onClick: self.handleContextToggle,
          dangerouslySetInnerHTML: {__html: '<i class="fa '+panelClass.icon+'"></i> '+panelClass.displayName}
        });
      }
    }.bind(this));

    return $$('div', {className: "context-toggles"},
      Substance.compact(panelComps)
    );
  },

  // Create a new panel based on current writer state (contextId)
  createContextPanel: function() {
    var contextId = this.state.contextId;
    var panelElement = null;
    var modules = this.writerCtrl.getModules();

    for (var i = 0; i < modules.length && !panelElement; i++) {
      var stateHandlers = modules[i].stateHandlers;
      if (stateHandlers && stateHandlers.handleContextPanelCreation) {
        panelElement = stateHandlers.handleContextPanelCreation(this.writerCtrl);
      }
    }

    if (!panelElement) {
      return $$('div', null, "No panels are registered");
    }
    return panelElement;
  },

  render: function() {
    return $$('div', {className: 'writer-component'},
      $$('div', {className: "main-container"},
        $$(ContentTools, {
          writerCtrl: this.writerCtrl
        }),
        $$(ContentPanel, {
          writerCtrl: this.writerCtrl,
        })
      ),
      $$('div', {className: "resource-container"},
        this.createContextToggles(),
        this.createContextPanel(this)
      ),
      $$(StatusBar, {
        doc: this.props.doc
      })
    );
  },

  getHighlightedNodes: function() {
    return this.writerCtrl.getHighlightedNodes();
  },

  getActiveContainerAnnotations: function() {
    return this.writerCtrl.getActiveContainerAnnotations();
  }

});

module.exports = Writer;