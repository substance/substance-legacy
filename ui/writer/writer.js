"use strict";

var Component = require('../component');
var $$ = Component.$$;

var _ = require("../../basics/helpers");
var EventEmitter = require('../../basics/event_emitter');
var SurfaceManager = require('../../surface/surface_manager');
var Clipboard = require('../../surface/clipboard');
var Registry = require('../../basics/registry');
var ToolRegistry = require('../../surface/tool_registry');

var ExtensionManager = require('./extension_manager');
var ContentToolbar = require("./content_tools");
var ContextToggles = require('./context_toggles');
var ContentPanel = require("./content_panel");
var StatusBar = require("./status_bar");
var ModalPanel = require('../modal_panel');

// TODO: re-establish a means to set which tools are enabled for which surface

class Writer extends Component {

  constructor(parent, props) {
    super(parent, props);
    // Mixin
    EventEmitter.call(this);

    this.handleApplicationKeyCombos = this.handleApplicationKeyCombos.bind(this);
    this.onSelectionChangedDebounced = _.debounce(this.onSelectionChanged, 50);

    this._registerExtensions();
    this._initializeComponentRegistry();
  }

  getChildContext() {
    return {
      getHighlightedNodes: this.getHighlightedNodes,
      getHighlightsForTextProperty: this.getHighlightsForTextProperty,
      componentRegistry: this.componentRegistry,
      toolRegistry: this.toolRegistry,
      surfaceManager: this.surfaceManager
    };
  }

  get classNames() {
    return 'writer-component';
  }

  getDocument() {
    return this.props.doc;
  }

  getInitialState() {
    var defaultContextId = this.props.contextId;
    return {"contextId": defaultContextId || "toc"};
  }

  render() {
    if (this.props.doc) {
      return $$('div', {}, 'Loading');
    } else {
      return [
        $$('div', { key: 'container', className: "main-container"},
          $$(ContentToolbar, { key: 'toolbar' }),
          $$(ContentPanel, { key: 'content', containerId: this.config.containerId })
        ),
        $$('div', { classNames: "resource-container" },
          $$(ContextToggles, { key: "context-toggles", panelOrder: this.config.panelOrder }),
          this._renderContextPanel(this)
        ),
        this._renderModalPanel(),
        $$(StatusBar, { key: 'statusBar' }),
        $$('div', { key: 'clipboard', classNames: "clipboard" })
      ];
    }
  }

  willReceiveProps(newProps) {
    if (this.props.doc && newProps.doc !== this.props.doc) {
      this._disposeDoc();
    }
  }

  didReceiveProps() {
    if (this.props.doc) {
      this.surfaceManager = new SurfaceManager(this.props.doc);
      this.clipboard = new Clipboard(this.surfaceManager, this.doc.getClipboardImporter(), this.doc.getClipboardExporter());
      this.props.doc.connect(this, {
        'transaction:started': this.transactionStarted,
        'document:changed': this.onDocumentChanged
      });
    }
  }

  willUpdateState(newState) {
    this.extensionManager.handleStateChange(newState, this.state);
  }

  didMount() {
    this.$el.on('keydown', this.handleApplicationKeyCombos);
  }

  willUnmount() {
    this.$el.off('keydown');
    if (this.props.doc) {
      this._disposeDoc();
    }
  }

  // return true when you handled a key combo
  handleApplicationKeyCombos(e) {
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
      this.setState(this.getInitialState());
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

  // Event handlers
  // --------------

  transactionStarted(tx) {
    // store the state so that it can be recovered when undo/redo
    tx.before.state = this.state;
    tx.before.selection = this.getSelection();
  }

  onDocumentChanged(change, info) {
    var doc = this.getDocument();
    doc.__dirty = true;
    var notifications = this.context.notifications;
    notifications.addMessage({
      type: "info",
      message: "Unsaved changes"
    });
    // after undo/redo, also recover the stored writer state
    if (info.replay && change.after.state) {
      this.setState(change.after.state);
    }
  }

  onSelectionChanged(sel, surface) {
    this.extensionManager.handleSelectionChange(sel);
    this.toolRegistry.each(function(tool) {
      tool.update(surface, sel);
    }, this);
    this.emit('selection:changed', sel);
  }

  // Action handlers
  // ---------------

  switchContext(contextId) {
    this.setState({ contextId: contextId });
  }

  executeAction(actionName) {
    return this.extensionManager.handleAction(actionName);
  }

  closeModal() {
    var newState = _.cloneDeep(this.state);
    delete newState.modal;
    this.setState(newState);
  }

  saveDocument() {
    var doc = this.props.doc;
    var backend = this.context.backend;
    var notifications = this.context.notifications;
    if (doc.__dirty && !doc.__isSaving) {
      notifications.addMessage({
        type: "info",
        message: "Saving ..."
      });

      doc.__isSaving = true;
      backend.saveDocument(doc, function(err) {
        doc.__isSaving = false;
        if (err) {
          notifications.addMessage({
            type: "error",
            message: err.message || err.toString()
          });
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
  }

  handleAction(actionName) {
    this.extensionManager.handleAction(actionName);
  }

  handleCloseDialog(e) {
    e.preventDefault();
    console.log('handling close');
    this.setState(this.getInitialState());
  }


  // Internal Methods
  // ----------------------

  _registerExtensions() {
    // Note: we are treating basics as extension internally
    var config = this.config;
    var basics = {
      name: "_basics",
      components: this.config.components || {},
      stateHandlers: config.stateHandlers || {},
      tools: config.tools || []
    };
    var extensions = [basics];
    if (config.extensions) {
      extensions = extensions.concat(config.extensions);
    }
    this.extensionManager = new ExtensionManager(extensions, this);
  }

  _initializeComponentRegistry() {
    var componentRegistry = new Registry();
    _.each(this.extensionManager.extensions, function(extension) {
      _.each(extension.components, function(ComponentClass, name) {
        componentRegistry.add(name, ComponentClass);
      });
    });
    this.componentRegistry = componentRegistry;
  }

  _initializeToolRegistry() {
    var toolRegistry = new ToolRegistry();
    _.each(this.extensionManager.extensions, function(extension) {
      _.each(extension.tools, function(ToolClass, name) {
        // WARN: this could potentially get problematic, if React derives
        // the current context differently.
        var context = _.extend({}, this.context, this.getChildContext());
        toolRegistry.add(name, new ToolClass(context));
      }, this);
    }, this);
    this.toolRegistry = toolRegistry;
  }

  _disposeDoc() {
    this.props.doc.disconnect(this);
    this.surfaceManager.dispose();
    this.clipboard.detach(this.$el[0]);
    this.surfaceManager.dispose();
    this.surfaceManager = null;
    this.clipboard = null;
  }

  _renderModalPanel() {
    var modalPanelElement = this.getActivePanelElement();
    if (!modalPanelElement) {
      // Just render an empty div if no modal active available
      return $$('div');
    }
    return $$(ModalPanel, {
      panelElement: modalPanelElement
    });
  }

  _renderContextPanel() {
    var panelElement = this.getActivePanelElement();
    if (!panelElement) {
      return $$('div', null, "No panels are registered");
    }
    return panelElement;
  }
}

_.extend(Writer.prototype, EventEmitter.prototype);

module.exports = Writer;
