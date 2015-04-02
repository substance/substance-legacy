'use strict';

var Substance = require('../basics');
var Document = require('../document');

// SurfaceObserver watches the DOM for changes that could not be detected by this class
// For instance, it is possible to use the native context menu to cut or paste
// Thus, it serves as a last resort to get the model back in sync with the UI (or reset the UI)
var DomObserver = require('./dom_observer');
var DomSelection = require('./dom_selection');

function Surface(element, model) {
  Substance.EventEmitter.call(this);

  this.element = element;
  this.model = model;

  this.domObserver = new DomObserver(this);
  this.domSelection = new DomSelection(element, this.model);

  // TODO: VE make jquery injectable
  this.$ = $;
  this.$window = this.$( window );
  this.$document = this.$( window.document );
  this.$element = $(element);

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
  this._delayedSelectionChange = function() {
    window.setTimeout(function() {
      self.onSelectionChange();
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

  this.attach = function() {
    this.attachKeyboardHandlers();
    this.attachMouseHandlers();
  };

  this.detach = function() {
    this.detachKeyboardHandlers();
    this.detachMouseHandlers();
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

  this.isRenderingLocked = function () {
    return this.renderLocks > 0;
  };

  this.incRenderLock = function () {
    this.renderLocks++;
  };

  this.decRenderLock = function () {
    this.renderLocks--;
  };

  this.handleLeftOrRightArrowKey = function ( /*e*/ ) {
    // let contenteditable move and then transfer the new window selection
    this._delayedSelectionChange();
  };

  this.handleUpOrDownArrowKey = function ( /*e*/ ) {
    // TODO: let contenteditable do the move and set the new selection afterwards
    console.log('TODO: handleUpOrDownArrowKey');
    this._delayedSelectionChange();
  };

  this.handleEnter = function( e ) {
    // var tx = this.model.startTransaction();
    // tx.break();
    // tx.save();
    console.log('TODO: handleEnter');
    e.preventDefault();
  };

  this.handleInsertion = function( e ) {
    // TODO: let contenteditable insert something and then see what it was
    console.log('TODO: handleInsertion');
    this.insertState = {
      selectionBefore: this.model.selection,
      selectionAfter: null
    };
    this.insertState.range = window.getSelection().getRangeAt(0);
  };

  this.afterKeyPress = function (e) {
    // TODO: fetch the last change from surfaceObserver
    console.log('afterKeyPress');
    if (this.insertState) {
      // get the text between the before insert and after insert
      var range = window.document.createRange();
      var before = this.insertState.range;
      var after = window.getSelection().getRangeAt(0);
      range.setStart(before.startContainer, before.startOffset);
      range.setEnd(after.startContainer, after.startOffset);
      var textInput = range.toString();

      var selectionAfter = this.domSelection.get();
      this.model.selection = this.insertState.selectionBefore;
      this.model.insertText(textInput, selectionAfter);

      this.insertState = null;
    }
  };

  this.handleDelete = function ( e ) {
    // TODO: let contenteditable delete and find out the diff afterwards
    console.log('TODO: handleDelete');
    e.preventDefault();
  };

  /* Event handlers */

  this.onFocus = function () {
    this.domObserver.start();
    this.focused = true;
    this.emit( 'focus' );
  };

  this.onBlur = function () {
    this.dragging = false;
    this.model.clearSelection();
    this.focused = false;
    this.emit( 'blur' );
  };

  this.onMouseDown = function ( e ) {
    if ( e.which !== 1 ) {
      return;
    }
    // Remember the mouse is down
    this.dragging = true;
    // Bind mouseup to the whole document in case of dragging out of the surface
    this.$document.on( 'mouseup', this._onMouseUp );

    // TODO: update selection delayed
    // Why should we need that?
    // Substance.delay(this._onSelectionChange);
  };

  this.onMouseUp = function ( /*e*/ ) {
    this.$document.off( 'mouseup', this._onMouseUp );
    // TODO: update selection
    this.dragging = false;
    this.setSelection(this.domSelection.get());
  };

  this.onMouseMove = function () {
    if (this.dragging) {
      // update selection during dragging
      this.model.selection = this.domSelection.get();
      // TODO: maybe this is not really necessary, as the main things are not really useful (such as tools)
      // while selection is dragged
      // this.emit('selection');
    }
  };

  // triggered by DOM itself
  this.onSelectionChange = function () {
    this.setSelection(this.domSelection.get());
  };

  /**
   * Handle document key down events.
   *
   * @method
   * @param {jQuery.Event} e Key down event
   * @fires selectionStart
   */
  this.onKeyDown = function( e ) {
    if ( e.which === 229 ) {
      // ignore fake IME events (emitted in IE and Chromium)
      return;
    }
    switch ( e.keyCode ) {
      case Surface.Keys.LEFT:
      case Surface.Keys.RIGHT:
        return this.handleLeftOrRightArrowKey( e );
      case Surface.Keys.UP:
      case Surface.Keys.DOWN:
        return this.handleUpOrDownArrowKey( e );
      case Surface.Keys.ENTER:
        e.preventDefault();
        return this.handleEnter( e );
      case Surface.Keys.BACKSPACE:
      case Surface.Keys.DELETE:
        e.preventDefault();
        return this.handleDelete( e );
      default:
        break;
    }
  };

  this.onKeyPress = function( e ) {
    // Filter out non-character keys. Doing this prevents:
    // * Unexpected content deletion when selection is not collapsed and the user presses, for
    //   example, the Home key (Firefox fires 'keypress' for it)
    // * Incorrect pawning when selection is collapsed and the user presses a key that is not handled
    //   elsewhere and doesn't produce any text, for example Escape
    // TODO: Should be covered with Selenium tests.
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

  /* Event handlers driven by dm.Document events */

  this.onModelSelect = function( newRange ) {
    if ( !newRange ) {
      return;
    }
    // If there is no focused node, use native selection, but ignore the selection if
    // changeModelSelection is currently being called with the same (object-identical)
    // selection object (i.e. if the model is calling us back)
    if ( !this.isRenderingLocked() ) {
      this.showSelection( this.model.getSelection() );
    }
    // TODO: update selection
    console.log('TODO: onModelSelect');
  };

  this.onDocumentChange = function(changes) {
    if (!this.isRenderingLocked()) {
    }
  };

  this.setSelection = function(sel) {
    if (!this.model.selection.equals(sel)) {
      console.log('Surface.setSelection: %s', sel.toString());
      this.model.selection = sel;
      this.emit('selection:changed', sel);
    }
  };

  this.getSelection = function() {
    return this.model.selection;
  };

};

Substance.inherit( Surface,   Substance.EventEmitter );

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
