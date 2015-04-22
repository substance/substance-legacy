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

  // we use this element to redirect ContentEditable actions to prevent
  // spoiling the DOM. E.g. this is done when typing over a ContainerSelection.
  // The element must be visible having a size > 0. We position on a very low z-index
  // and make it transparent.
  this.ce = window.document.createElement('div');
  this.$ce = $(this.ce)
    .css({
      position: 'fixed', top: -100, "z-index": -1000,
      opacity: 0, width: 50, height: 50
    });

  this.dragging = false;

  this._onMouseUp = Substance.bind( this.onMouseUp, this );
  this._onMouseDown = Substance.bind( this.onMouseDown, this );
  this._onMouseMove = Substance.bind( this.onMouseMove, this );
  this._onKeyDown = Substance.bind( this.onKeyDown, this );
  this._onKeyPress = Substance.bind( this.onKeyPress, this );
  this._onBlur = Substance.bind( this.onBlur, this );
  this._onFocus = Substance.bind( this.onFocus, this );

  this._onCompositionEnd = Substance.bind( this.onCompositionEnd, this );

  // state used by handleInsertion
  this.insertState = null;

  this._onDomMutations = Substance.bind(this.onDomMutations, this);
  this.domObserver = new window.MutationObserver(this._onDomMutations);
  this.domObserverConfig = { subtree: true, characterData: true };
  this.skipNextObservation = false;
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
    this.$element.on('keypress', this._onKeyPress);
    // OSX specific handling of dead-keys
    if (this.element.addEventListener) {
      this.element.addEventListener('compositionend', this._onCompositionEnd, false);
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
  };

  this.detach = function() {
    var doc = this.editor.getDocument();

    this.domObserver.disconnect();
    this.$ce.remove();

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
    this.$element.off('keypress', this._onKeyPress);
    if (this.element.addEventListener) {
      this.element.removeEventListener('compositionend', this._onCompositionEnd, false);
    }

    // Clean-up
    //
    this.editor.setContainer(null);
    this.element = null;
    this.$element = null;
    this.domSelection = null;
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
        e.preventDefault();
        return this.handleEnterKey(e);
      case Surface.Keys.SPACE:
        e.preventDefault();
        return this.handleSpace(e);
      case Surface.Keys.BACKSPACE:
      case Surface.Keys.DELETE:
        e.preventDefault();
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
      this.emit('selection:changed', sel);
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
    // HACK: for typing text we let ContentEditable go as opposed to implement
    // a full-fledged keyboard input handler. For ContainerSelections this
    // leads to a hazard, as CE destroys our container node content
    // This approach redirects the input into a hidden contenteditable field.
    // Pitfalls are, that we need to detect properly when to do this (otherwise selection gets lost)
    // *plus* it is not working in IE.
    else if (this.editor.selection.isContainerSelection() && e.keyCode >= 65) {
      // console.log('####', e.keyCode, e.metaKey, e.ctrlKey, e.shiftKey);
      this.$ce.empty();
      this.$element.append(this.$ce);
      this._insertSelection = this.editor.selection;
      var wsel = window.getSelection();
      var wrange = window.document.createRange();
      wrange.setStart(this.ce,0);
      wsel.removeAllRanges();
      wsel.addRange(wrange);
    }
  };

  /**
   * Handle key events not consumed by onKeyDown.
   * Essentially this is used to handle text typing.
   */
  this.onKeyPress = function( e ) {
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
    // TODO: we need to make sure that there actually was content
    this.handleInsertion(e);
  };

  // Handling Dead-keys under OSX
  this.onCompositionEnd = function(e) {
    try {
      var range = this.editor.selection.getRange();
      var el = DomSelection.getDomNodeForPath(this.element, range.start.path);
      this.editor.insertText(e.data, this.editor.selection, {source: el, mode: 'typing'});
    } catch (error) {
      console.error(error);
    }
  };

  this.handleInsertion = function( /*e*/ ) {
    // get the text between the position before insert and after insert
    var self = this;
    var el, sel;
    this.skipNextObservation=true;
    if (this._insertSelection && this._insertSelection.isContainerSelection()) {
      sel = this._insertSelection;
      this._insertSelection = null;
      setTimeout(function() {
        var textInput = self.ce.textContent;
        self.editor.insertText(textInput, sel);
      });
    } else {
      sel = this.editor.selection;
      var range = sel.getRange();
      el = DomSelection.getDomNodeForPath(this.element, range.start.path);
      setTimeout(function() {
        var text = el.textContent;
        var textInput = text.substring(range.start.offset, range.start.offset+1);
        // Note: providing the source element, so that the TextProperty can decide not to render
        self.editor.insertText(textInput, sel, {source: el, typing: true});
      });
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
    e.preventDefault();
    var selection = this.domSelection.get();
    var direction = (e.keyCode === Surface.Keys.BACKSPACE) ? 'left' : 'right';
    this.editor.delete(selection, direction);
  };


  this.handleSpace = function( e ) {
    e.preventDefault();
    var selection = this.domSelection.get();
    this.editor.insertText(" ", selection);
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
    // update the domSelection first so that we know if we are
    // within this surface at all
    if (!info.replay && !info.typing) {
      var self = this;
      window.setTimeout(function() {
        // GUARD: For cases where the panel/or whatever has been disposed already
        // after changing the doc
        if (!self.domSelection) return;
        var sel = change.after.selection;
        self.editor.selection = sel;
        self.domSelection.set(sel);
        self.emit('selection:changed', sel);
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
      this.emit('selection:changed', sel);
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

module.exports = Surface;
