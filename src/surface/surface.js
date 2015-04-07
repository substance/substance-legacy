'use strict';

var Substance = require('../basics');

// DomSelection is used to map DOM to editor selections and vice versa
var DomSelection = require('./dom_selection');
// DomContainer is used to analyze the component layout, e.g., to implement container-wide editing such as break or merge
var DomContainer = require('./dom_container');

function Surface(editor) {
  Substance.EventEmitter.call(this);

  // this.element must be set via surface.attach(element)
  this.element = null;
  this.editor = editor;

  this.domSelection = null;
  this.domContainer = null;

  // TODO: VE make jquery injectable
  this.$ = $;
  this.$window = this.$( window );
  this.$document = this.$( window.document );

  this.dragging = false;
  this.focused = false;

  // This is set on entering changeModel, then unset when leaving.
  // It is used to test whether a reflected change event is emitted.
  this.hasSelectionChangeEvents = 'onselectionchange' in window.document;

  var self = this;
  this._onMouseUp = Substance.bind( this.onMouseUp, this );
  this._onMouseDown = Substance.bind( this.onMouseDown, this );
  this._onMouseMove = Substance.bind( this.onMouseMove, this );
  this._onSelectionChange = Substance.bind( this.onSelectionChange, this );
  this._delayedUpdateModelSelection = function(options) {
    window.setTimeout(function() {
      self._updateModelSelection(options);
    });
  };
  this._onKeyDown = Substance.bind( this.onKeyDown, this );
  this._onKeyPress = Substance.bind( this.onKeyPress, this );
  this._afterKeyPress = function(e) {
    window.setTimeout(function() {
      self.afterKeyPress(e);
    });
  };
  // this._onCut = Substance.bind( this.onCut, this );
  // this._onCopy = Substance.bind( this.onCopy, this );

  // state used by handleInsertion
  this.insertState = null;
}

Surface.Prototype = function() {

  this.attach = function(element) {
    this.element = element;
    this.$element = $(element);
    this.domSelection = new DomSelection(element, this.editor);
    this.domContainer = new DomContainer(element);
    this.attachKeyboardHandlers();
    this.attachMouseHandlers();
    this.editor.setContainer(this.domContainer);
    // this.editor.getDocument().connect(this, {
    //   'document:changed': this.onDocumentChange
    // });
  };

  this.detach = function() {
    this.detachKeyboardHandlers();
    this.detachMouseHandlers();
    this.element = null;
    this.$element = null;
    this.domSelection = null;
    this.domContainer = null;
    this.editor.setContainer(null);
    // this.editor.getDocument().disconnect(this);
  };

  this.update = function() {
    if (this.domContainer) {
      this.domContainer.reset();
    }
  };

  this.dispose = function() {
    this.detach();
  };

  this.attachKeyboardHandlers = function() {
    this.$element.on('keydown', this._onKeyDown);
    this.$element.on('keypress', this._onKeyPress);
    this.$element.on('keypress', this._afterKeyPress);
  };

  this.detachKeyboardHandlers = function() {
    this.$element.off('keydown', this._onKeyDown);
    this.$element.off('keypress', this._onKeyPress);
    this.$element.off('keypress', this._afterKeyPress);
  };

  this.attachMouseHandlers = function() {
    if ( this.hasSelectionChangeEvents ) {
      this.$document.on( 'selectionchange', this._onSelectionChange );
    } else {
      this.$element.on( 'mousemove', this._onSelectionChange );
    }
    this.$element.on( 'mousemove', this._onMouseMove );
    this.$element.on( 'mousedown', this._onMouseDown );
  };

  this.detachMouseHandlers = function() {
    if ( this.hasSelectionChangeEvents ) {
      this.$document.off( 'selectionchange', this._onSelectionChange );
    } else {
      this.$element.off( 'mousemove', this._onSelectionChange );
    }
    this.$element.off( 'mousemove', this._onMouseMove );
    this.$element.off( 'mousedown', this._onMouseDown );
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
    // TODO: let contenteditable do the move and set the new selection afterwards
    console.log('TODO: handleUpOrDownArrowKey');
    this._delayedUpdateModelSelection();
  };

  this.handleEnterKey = function( e ) {
    e.preventDefault();
    var selection = this.domSelection.get();
    this.editor.break(selection);
    this._updateDomSelection(this.editor.selection);
  };

  this.handleDeleteKey = function ( e ) {
    // TODO: let contenteditable delete and find out the diff afterwards
    e.preventDefault();
    // poll the selection here
    var selection = this.domSelection.get();
    var direction = (e.keyCode === Surface.Keys.BACKSPACE) ? 'left' : 'right';
    this.editor.delete(selection, direction, {});
    this._updateDomSelection(this.editor.selection);
  };


  this.handleSpace = function( e ) {
    e.preventDefault();
    var selection = this.domSelection.get();
    var source = this.domSelection.nativeRanges[0].start;
    this.editor.insertText(" ", selection, {
      source: source
    });
    this._updateDomSelection(this.editor.selection);
  };

  this.handleInsertion = function( /*e*/ ) {
    // keep the current selection, let contenteditable insert,
    // and get the inserted diff afterKeyPress
    this.insertState = {
      selectionBefore: this.editor.selection,
      selectionAfter: null,
      nativeRangeBefore: this.domSelection.nativeRanges[0],
      range: window.getSelection().getRangeAt(0)
    };
  };

  this.afterKeyPress = function ( /*e*/ ) {
    // TODO: fetch the last change from surfaceObserver
    console.log('afterKeyPress');
    if (this.insertState) {
      var insertState = this.insertState;
      this.insertState = null;


      // get the text between the before insert and after insert
      var range = window.document.createRange();
      var before = insertState.range;
      var after = window.getSelection().getRangeAt(0);
      range.setStart(before.startContainer, before.startOffset);
      range.setEnd(after.startContainer, after.startOffset);
      var textInput = range.toString();

      var selectionBefore = insertState.selectionBefore;
      var self = this;
      // the property's element which is affected by this insert
      // we use it to let the view component check if it needs to rerender or trust contenteditable
      var source = insertState.nativeRangeBefore.start;
      this.editor.insertText(textInput, selectionBefore, {
        source: source
      });
      this._updateDomSelection(this.editor.selection);
    }
  };

  /* Event handlers */

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
    this._setModelSelection(this.domSelection.get());
  };

  this.onMouseMove = function() {
    if (this.dragging) {
      // TODO: do we want that?
      // update selection during dragging
      // this._setModelSelection(this.domSelection.get());
    }
  };

  this.onSelectionChange = function () {
    if (this.isFocused) {
      var sel = this.domSelection.get();
      if(sel.isNull()) {
        console.log('Surface.onSelectionChange: Unfocussing', this.name)
        this.isFocused = false;
      }
    }
  };

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
      // Ignore all keypresses with Ctrl / Cmd modifier keys
      !!( e.ctrlKey || e.metaKey )
    ) {
      return;
    }
    this.handleInsertion(e);
  };

  this.getSelection = function() {
    return this.editor.selection;
  };

  this._updateDomSelection = function(sel) {
    var self = this;
    window.setTimeout(function() {
      self.domSelection.set(sel);
    });
  }

  /**
   * Set the model selection and update the DOM selection accordingly
   */
  this.setSelection = function(sel) {
    if (this._setModelSelection(sel)) {
      // also update the DOM selection
      this.domSelection.set(sel);
      // HACK: is there a better place to update focused state?
      this.updateFocusState(sel);
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
    if (!this.editor.selection.equals(sel)) {
      console.log('Surface.setSelection: %s', sel.toString());
      this.editor.selection = sel;
      this.updateFocusState(sel);
      this.emit('selection:changed', sel);
      return true;
    }
  };

  /**
   * Update the internal focus state.
   *
   * Triggered by DOM selection change events.
   */
  this.updateFocusState = function (sel) {
    this.isFocused = !sel.isNull();
    console.log('%s.isFocused: %s', this.name, this.isFocused);
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
