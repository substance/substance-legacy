'use strict';

var Substance = require('../basics');

// DomSelection is used to map DOM to editor selections and vice versa
var DomSelection = require('./dom_selection');

var __id__ = 0;

function Surface(editor, options) {
  Substance.EventEmitter.call(this);

  options = options || {};

  this.__id__ = __id__++;

  // this.element must be set via surface.attach(element)
  this.element = null;
  this.$element = null;
  this.editor = editor;

  this.domSelection = null;

  this.logger = options.logger || window.console;

  // TODO: VE make jquery injectable
  this.$ = $;
  this.$window = this.$( window );
  this.$document = this.$( window.document );

  this.dragging = false;

  this._onMouseUp = Substance.bind( this.onMouseUp, this );
  this._onMouseDown = Substance.bind( this.onMouseDown, this );
  this._onMouseMove = Substance.bind( this.onMouseMove, this );

  this._onKeyDown = Substance.bind(this.onKeyDown, this);
  this._onTextInput = Substance.bind(this.onTextInput, this);
  this._onTextInputShim = Substance.bind( this.onTextInputShim, this );
  this._onCompositionStart = Substance.bind( this.onCompositionStart, this );

  this._onBlur = Substance.bind( this.onBlur, this );
  this._onFocus = Substance.bind( this.onFocus, this );

  this._onDomMutations = Substance.bind(this.onDomMutations, this);
  this.domObserver = new window.MutationObserver(this._onDomMutations);
  this.domObserverConfig = { subtree: true, characterData: true };
  this.skipNextObservation = false;

  this.enabled = false;

  this.isIE = Surface.detectIE();
  this.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  this.undoEnabled = true;
  if (options.undoEnabled != null) {
    this.undoEnabled = options.undoEnabled;
  }
}

Surface.Prototype = function() {

  this.getContainerName = function() {
    if (this.editor.isContainerEditor()) {
      return this.editor.getContainerName();
    }
  };

  this.getContainer = function() {
    return this.editor.getContainer();
  };

  this.getEditor = function() {
    return this.editor;
  };

  this.getDocument = function() {
    return this.editor.getDocument();
  };

  this.dispose = function() {
    this.detach();
  };

  this.attach = function(element) {
    if (!element) {
      throw new Error('Illegal argument: Surface element is required. was ' + element);
    }
    var doc = this.editor.getDocument();

    // Initialization
    this.element = element;
    this.$element = $(element);
    this.$element.prop('contentEditable', 'true');
    this.domSelection = new DomSelection(element, this.editor.getContainer());

    // Keyboard Events
    //
    this.$element.on('keydown', this._onKeyDown);

    // OSX specific handling of dead-keys
    if (this.element.addEventListener) {
      this.element.addEventListener('compositionstart', this._onCompositionStart, false);
    }

    if (window.TextEvent && !this.isIE) {
      this.element.addEventListener('textInput', this._onTextInput, false);
    } else {
      this.$element.on('keypress', this._onTextInputShim);
    }

    // Mouse Events
    //
    this.$element.on( 'mousemove', this._onMouseMove );
    this.$element.on( 'mousedown', this._onMouseDown );
    this.$element.on('blur', this._onBlur);
    this.$element.on('focus', this._onFocus);

    // Document Change Events
    //
    // listen to updates so that we can set the selection (only for editing not for replay)
    doc.connect(this, { 'document:changed': this.onDocumentChange });

    this.domObserver.observe(element, this.domObserverConfig);

    this.attached = true;
  };

  this.detach = function() {
    var doc = this.editor.getDocument();

    this.domObserver.disconnect();

    // Document Change Events
    //
    doc.disconnect(this);

    // Mouse Events
    //
    this.$element.off( 'mousemove', this._onMouseMove );
    this.$element.off( 'mousedown', this._onMouseDown );
    this.$element.off('blur', this._onBlur);
    this.$element.off('focus', this._onFocus);

    // Keyboard Events
    //
    this.$element.off('keydown', this._onKeyDown);
    if (this.element.addEventListener) {
      this.element.removeEventListener('compositionstart', this._onCompositionStart, false);
    }
    if (window.TextEvent && !this.isIE) {
      this.element.removeEventListener('textInput', this._onTextInput, false);
    } else {
      this.$element.off('keypress', this._onTextInputShim);
    }

    // Clean-up
    //
    this.element = null;
    this.$element = null;
    this.domSelection = null;

    this.attached = false;
  };

  this.isAttached = function() {
    return this.attached;
  };

  this.enable = function() {
    this.$element.prop('contentEditable', 'true');
    this.enabled = true;
  };

  this.isEnabled = function() {
    return this.enabled;
  };

  this.disable = function() {
    this.$element.prop('contentEditable', 'false');
    this.enabled = false;
  };

  // ###########################################
  // Keyboard Handling
  //

  /**
   * Handle document key down events.
   */
  this.onKeyDown = function( e ) {
    if ( e.which === 229 ) {
      // ignore fake IME events (emitted in IE and Chromium)
      return;
    }
    switch ( e.keyCode ) {
      case Surface.Keys.LEFT:
      case Surface.Keys.RIGHT:
        return this.handleLeftOrRightArrowKey(e);
      case Surface.Keys.UP:
      case Surface.Keys.DOWN:
        return this.handleUpOrDownArrowKey(e);
      case Surface.Keys.ENTER:
        return this.handleEnterKey(e);
      case Surface.Keys.BACKSPACE:
      case Surface.Keys.DELETE:
        return this.handleDeleteKey(e);
      default:
        break;
    }

    // Built-in key combos
    // console.log('####', e.keyCode, e.metaKey, e.ctrlKey, e.shiftKey);
    // Ctrl+A: select all
    var handled = false;
    if ( (e.ctrlKey||e.metaKey) && e.keyCode === 65 ) {
      console.log('Selecting all...');
      this.editor.selectAll();
      var sel = this.editor.selection;
      this.setSelection(sel);
      this.domSelection.set(sel);
      this.emit('selection:changed', sel, this);
      handled = true;
    }
    // Undo/Redo: cmd+z, cmd+shift+z
    else if (this.undoEnabled && e.keyCode === 90 && (e.metaKey||e.ctrlKey)) {
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  this.undo = function() {
    var doc = this.getDocument();
    if (doc.done.length>0) {
      doc.undo();
    }
  };

  this.redo = function() {
    var doc = this.getDocument();
    if (doc.undone.length>0) {
      doc.redo();
    }
  };


  this.onTextInput = function(e) {
    if (!e.data) return;
    // console.log("TextInput:", e);
    this.skipNextObservation=true;
    var sel = this.editor.selection;
    var range = sel.getRange();
    var el = DomSelection.getDomNodeForPath(this.element, range.start.path);
    // When the cursor is collapsed we can be brave
    // and let CE do the incremental update.
    // This increases speed while typing as we do not rerender so eagerly
    if (sel.isCollapsed()) {
      this.editor.insertText(e.data, sel, {source: el, typing: true});
    }
    // In case of typing-over we do not trust CE, thus
    // we do not store the source info, and stop the default event behavior.
    else {
      var self = this;
      this.editor.insertText(e.data, sel);
      setTimeout(function() {
        self.rerenderDomSelection();
      });
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handling Dead-keys under OSX
  this.onCompositionStart = function(e) {
    // just tell DOM observer that we have everything under control
    this.skipNextObservation = true
  };

  // a shim for textInput events based on keyPress and a horribly dangerous dance with the CE
  this.onTextInputShim = function( e ) {
    // Filter out non-character keys. Doing this prevents:
    // * Unexpected content deletion when selection is not collapsed and the user presses, for
    //   example, the Home key (Firefox fires 'keypress' for it)
    // * Incorrect pawning when selection is collapsed and the user presses a key that is not handled
    //   elsewhere and doesn't produce any text, for example Escape
    if (
      // Catches most keys that don't produce output (charCode === 0, thus no character)
      e.which === 0 || e.charCode === 0 ||
      // Opera 12 doesn't always adhere to that convention
      e.keyCode === Surface.Keys.TAB || e.keyCode === Surface.Keys.ESCAPE ||
      // prevent combinations with meta keys, but not alt-graph which is represented as ctrl+alt
      !!(e.metaKey) || (!!e.ctrlKey^!!e.altKey)
    ) {
      return;
    }
    var character = String.fromCharCode(e.which);
    var sel, range, el;
    this.skipNextObservation=true;
    sel = this.editor.selection;
    if (!e.shiftKey) {
      character = character.toLowerCase();
    }
    if (character.length>0) {
      sel = this.editor.selection;
      range = sel.getRange();
      el = DomSelection.getDomNodeForPath(this.element, range.start.path);
      this.editor.insertText(character, sel, {source: el, typing: true});
      if (sel.isContainerSelection()) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  this.handleLeftOrRightArrowKey = function ( e ) {
    var self = this;
    window.setTimeout(function() {
      self._updateModelSelection({
        left: (e.keyCode === Surface.Keys.LEFT),
        right: (e.keyCode === Surface.Keys.RIGHT)
      });
    });
  };

  this.handleUpOrDownArrowKey = function ( /*e*/ ) {
    var self = this;
    window.setTimeout(function() {
      self._updateModelSelection();
    });
  };

  this.handleEnterKey = function( e ) {
    e.preventDefault();
    var selection = this.domSelection.get();
    if (e.shiftKey) {
      this.editor.softBreak(selection);
    } else {
      this.editor.break(selection);
    }
  };

  this.handleDeleteKey = function ( e ) {
    var direction = (e.keyCode === Surface.Keys.BACKSPACE) ? 'left' : 'right';
    var sel = this.editor.selection;
    var range = sel.getRange();
    // minor optimization: in simple cases we can let CE do the delete
    if (range.isCollapsed() && direction === 'left' && range.start.offset !== 0) {
      this.skipNextObservation = true;
      var el = DomSelection.getDomNodeForPath(this.element, range.start.path);
      this.editor.delete(sel, direction, {source: el, typing: true});
    } else {
      e.preventDefault()
      this.editor.delete(sel, direction);
    }
  };

  // ###########################################
  // Mouse Handling
  //

  this.onMouseDown = function(e) {
    if ( e.which !== 1 ) {
      return;
    }
    // Bind mouseup to the whole document in case of dragging out of the surface
    this.dragging = true;
    this.$document.on( 'mouseup', this._onMouseUp );
  };

  this.onMouseUp = function(/*e*/) {
    // ... and unbind the temporary handler
    this.$document.off( 'mouseup', this._onMouseUp );
    this.dragging = false;
    // HACK: somehow the DOM selection is not ready yet
    var self = this;
    setTimeout(function() {
      self._setModelSelection(self.domSelection.get());
    });
  };

  this.onMouseMove = function() {
    if (this.dragging) {
      // TODO: do we want that?
      // update selection during dragging
      // this._setModelSelection(this.domSelection.get());
    }
  };

  this.onBlur = function() {
    // console.log('Blurring surface', this.name, this.__id__);
    this.isFocused = false;
    this.setSelection(Substance.Document.nullSelection);
  };

  this.onFocus = function() {
    // console.log('Focusing surface', this.name, this.__id__);
    this.isFocused = true;
  };

  this.onDomMutations = function() {
    if (this.skipNextObservation) {
      this.skipNextObservation = false;
      return;
    }
    // Known use-cases:
    //  - Context-menu:
    //      - Delete
    //      - Note: copy, cut, paste work just fine
    console.info("We want to enable a DOM MutationObserver which catches all changes made by native interfaces (such as spell corrections, etc). Lookout for this message and try to set Surface.skipNextObservation=true when you know that you will mutate the DOM.");
  };

  // ###########################################
  // Document and Selection Changes
  //

  this.onDocumentChange = function(change, info) {
    if (!this.isFocused) {
      return;
    }
    if ( (this.undoEnabled|| !info.replay) && !info.typing) {
      var self = this;
      window.setTimeout(function() {
        // GUARD: For cases where the panel/or whatever has been disposed already
        // after changing the doc
        if (!self.domSelection) return;
        var sel = change.after.selection;
        self.editor.selection = sel;
        self.domSelection.set(sel);
        self.emit('selection:changed', sel, self);
      });
    }
  };

  this.getSelection = function() {
    return this.editor.selection;
  };

  /**
   * Set the model selection and update the DOM selection accordingly
   */
  this.setSelection = function(sel) {
    if (this._setModelSelection(sel)) {
      if (this.domSelection) {
        // also update the DOM selection
        this.domSelection.set(sel);
      }
    }
  };

  this.rerenderDomSelection = function() {
    if (this.isFocused) {
      this.domSelection.set(this.getSelection());
    }
  };

  this._updateModelSelection = function(options) {
    this._setModelSelection(this.domSelection.get(options));
  };

  /**
   * Set the model selection only (without DOM selection update).
   *
   * Used internally if we derive the model selection from the DOM selcection.
   */
  this._setModelSelection = function(sel) {
    sel = sel || Substance.Document.nullSelection;
    if (!this.editor.selection.equals(sel)) {
      // console.log('Surface.setSelection: %s', sel.toString());
      this.editor.selection = sel ;
      this.emit('selection:changed', sel, this);
      return true;
    }
  };

  this.getLogger = function() {
    return this.logger;
  };

};

Substance.inherit( Surface, Substance.EventEmitter );

Surface.Keys =  {
  UNDEFINED: 0,
  BACKSPACE: 8,
  DELETE: 46,
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  END: 35,
  HOME: 36,
  TAB: 9,
  PAGEUP: 33,
  PAGEDOWN: 34,
  ESCAPE: 27,
  SHIFT: 16,
  SPACE: 32
};

Surface.detectIE = function() {
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf('MSIE ');
  if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }
  var trident = ua.indexOf('Trident/');
  if (trident > 0) {
      // IE 11 => return version number
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }
  var edge = ua.indexOf('Edge/');
  if (edge > 0) {
     // IE 12 => return version number
     return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }
  // other browser
  return false;
};

module.exports = Surface;
