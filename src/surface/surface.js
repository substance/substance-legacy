'use strict';

var Substance = require('../basics');

// DomSelection is used to map DOM to editor selections and vice versa
var DomSelection = require('./dom_selection');
// DomContainer is used to analyze the component layout, e.g., to implement container-wide editing such as break or merge
var DomContainer = require('./dom_container');
var Document = require('../document');

var __id__ = 0;

function Surface(editor) {
  Substance.EventEmitter.call(this);

  this.__id__ = __id__++;

  // this.element must be set via surface.attach(element)
  this.element = null;
  this.editor = editor;

  this.domSelection = null;
  this.domContainer = null;
  this.containerAnnotationEvents = new Document.ContainerAnnotationEvents(editor.getDocument());

  // TODO: VE make jquery injectable
  this.$ = $;
  this.$window = this.$( window );
  this.$document = this.$( window.document );

  this.dragging = false;

  var self = this;
  this._onMouseUp = Substance.bind( this.onMouseUp, this );
  this._onMouseDown = Substance.bind( this.onMouseDown, this );
  this._onMouseMove = Substance.bind( this.onMouseMove, this );
  this._delayedUpdateModelSelection = function(options) {
    window.setTimeout(function() {
      self._updateModelSelection(options);
    });
  };
  this._onKeyDown = Substance.bind( this.onKeyDown, this );
  this._onKeyPress = Substance.bind( this.onKeyPress, this );
  this._onBlur = Substance.bind( this.onBlur, this );
  this._onFocus = Substance.bind( this.onFocus, this );

  this._afterKeyPress = function(e) {
    window.setTimeout(function() {
      self.afterKeyPress(e);
    });
  };

  this._onCompositionEnd = Substance.bind( this.onCompositionEnd, this );

  // state used by handleInsertion
  this.insertState = null;
}

Surface.Prototype = function() {

  this.attach = function(element) {
    this.element = element;
    this.$element = $(element);
    this.$element.prop('contentEditable', 'true');
    this.domContainer = new DomContainer(element);
    this.domSelection = new DomSelection(element, this.domContainer);

    this.attachKeyboardHandlers();
    this.attachMouseHandlers();

    // OSX specific handling of dead-keys
    if (this.element.addEventListener) {
      this.element.addEventListener('compositionend', this._onCompositionEnd, false);
    }

    this.$element.on('blur', this._onBlur);
    this.$element.on('focus', this._onFocus);

    this.editor.setContainer(this.domContainer);
    var doc = this.editor.getDocument();

    // HACK: we need this proxy to efficiently react on container annotation
    // updates.
    this.containerAnnotationEvents.setContainer(this.domContainer);
    this.containerAnnotationEvents.attach();

    // listen to updates so that we can set the selection (only for editing
    // not for replay)
    doc.connect(this, {
      'document:changed': this.onDocumentChange
    });
  };

  this.detach = function() {
    this.containerAnnotationEvents.detach();

    this.editor.getDocument().disconnect(this);
    this.editor.setContainer(null);

    if (this.element.addEventListener) {
      this.element.removeEventListener('compositionend', this._onCompositionEnd, false);
    }

    this.detachMouseHandlers();
    this.detachKeyboardHandlers();

    this.element = null;
    this.$element = null;
    this.domSelection = null;
    this.domContainer = null;
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
    this.$element.on( 'mousemove', this._onMouseMove );
    this.$element.on( 'mousedown', this._onMouseDown );
  };

  this.detachMouseHandlers = function() {
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
    this._delayedUpdateModelSelection();
  };

  this.handleEnterKey = function( e ) {
    e.preventDefault();
    var selection = this.domSelection.get();
    this.editor.break(selection);
  };

  this.handleDeleteKey = function ( e ) {
    e.preventDefault();
    var selection = this.domSelection.get();
    var direction = (e.keyCode === Surface.Keys.BACKSPACE) ? 'left' : 'right';
    this.editor.delete(selection, direction, {});
  };


  this.handleSpace = function( e ) {
    e.preventDefault();
    var selection = this.domSelection.get();
    this.editor.insertText(" ", selection, {});
  };

  this.handleInsertion = function( /*e*/ ) {
    this.handlingInsertion = true;
  };

  this.afterKeyPress = function ( /*e*/ ) {
    if (this.handlingInsertion) {
      this.handlingInsertion = false;
      // get the text between the before insert and after insert
      var range = this.editor.selection.getRange();
      var el = DomSelection.getDomNodeForPath(this.element, range.start.path);
      var text = el.textContent;
      var textInput = text.substring(range.start.offset, range.start.offset+1);
      // the property's element which is affected by this insert
      // we use it to let the view component check if it needs to rerender or trust contenteditable
      var source = this.domSelection.nativeSelectionData.range.start;
      this.editor.insertText(textInput, this.editor.selection, {
        source: source
      });
    }
  };

  // Handling Dead-keys under OSX
  this.onCompositionEnd = function(e) {
    try {
      var sel = this.editor.selection;
      var source = DomSelection.getDomNodeForPath(this.element, sel.getRange().start.path);
      this.editor.insertText(e.data, this.editor.selection, { source: source });
    } catch (error) {
      console.error(error);
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

  this.onBlur = function() {
    // console.log('Blurring surface', this.name, this.__id__);
    this.isFocused = false;
    this.setSelection(Substance.Document.nullSelection);
  };

  this.onFocus = function() {
    // console.log('Focusing surface', this.name, this.__id__);
    this.isFocused = true;
  };

  this.onDocumentChange = function(change, info) {
    if (!this.isFocused) {
      return;
    }

    // update the domSelection first so that we know if we are
    // within this surface at all
    if (!info.replay) {
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

  this.getContainerName = function() {
    if (this.editor.isContainerEditor()) {
      return this.editor.getContainerName();
    }
  };

  this.getContainer = function() {
    if (this.editor.isContainerEditor()) {
      return this.editor.container;
    }
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
