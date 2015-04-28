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

  // set when editing is enabled
  this.enabled = false;

  // surface usually gets frozen while showing a popup
  this.frozen = false;
  this.$caret = $('<span>').addClass('surface-caret');

  this.isIE = Surface.detectIE();
  this.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  this.undoEnabled = true;

  /*jshint eqnull:true */
  if (options.undoEnabled != null) {
    this.undoEnabled = options.undoEnabled;
  }
  if (options.contentEditable != null) {
    this.enableContentEditable = options.contentEditable;
  } else {
    this.enableContentEditable = true;
  }
  /*jshint eqnull:false */
}

Surface.Prototype = function() {

  this.getElement = function() {
    return this.element;
  };

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
    if (this.enableContentEditable) {
      this.$element.prop('contentEditable', 'true');
    }
    this.domSelection = new DomSelection(element, this.editor.getContainer());

    this.$element.addClass('surface');

    // Keyboard Events
    //
    this.attachKeyboard();

    // Mouse Events
    //
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

  this.attachKeyboard = function() {
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
  };

  this.detach = function() {
    var doc = this.editor.getDocument();

    this.domObserver.disconnect();

    // Document Change Events
    //
    doc.disconnect(this);

    // Mouse Events
    //
    this.$element.off( 'mousedown', this._onMouseDown );
    this.$element.off('blur', this._onBlur);
    this.$element.off('focus', this._onFocus);

    // Keyboard Events
    //
    this.detachKeyboard();

    this.$element.removeClass('surface');

    // Clean-up
    //
    this.element = null;
    this.$element = null;
    this.domSelection = null;

    this.attached = false;
  };

  this.detachKeyboard = function() {
    this.$element.off('keydown', this._onKeyDown);
    if (this.element.addEventListener) {
      this.element.removeEventListener('compositionstart', this._onCompositionStart, false);
    }
    if (window.TextEvent && !this.isIE) {
      this.element.removeEventListener('textInput', this._onTextInput, false);
    } else {
      this.$element.off('keypress', this._onTextInputShim);
    }
  };

  this.isAttached = function() {
    return this.attached;
  };

  this.enable = function() {
    if (this.enableContentEditable) {
      this.$element.prop('contentEditable', 'true');
    }
    this.enabled = true;
  };

  this.isEnabled = function() {
    return this.enabled;
  };

  this.disable = function() {
    if (this.enableContentEditable) {
      this.$element.removeAttr('contentEditable');
    }
    this.enabled = false;
  };

  this.freeze = function() {
    console.log('Freezing surface...');
    if (this.enableContentEditable) {
      this.$element.removeAttr('contentEditable');
    }
    this.$element.addClass('frozen');
    this.domObserver.disconnect();
    this.frozen = true;
  };

  this.unfreeze = function() {
    if (!this.frozen) {
      return;
    }
    console.log('Unfreezing surface...');
    if (this.enableContentEditable) {
      this.$element.prop('contentEditable', 'true');
    }
    this.$element.removeClass('frozen');
    this.domObserver.observe(this.element, this.domObserverConfig);
    this.frozen = false;
  };

  // ###########################################
  // Keyboard Handling
  //

  /**
   * Handle document key down events.
   */
  this.onKeyDown = function( e ) {
    if (this.frozen) {
      return;
    }
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
    if (this.frozen) {
      return;
    }
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
      this.editor.insertText(e.data, sel, {surface: this, source: el, typing: true});
    }
    // In case of typing-over we do not trust CE, thus
    // we do not store the source info, and stop the default event behavior.
    else {
      var self = this;
      this.editor.insertText(e.data, sel, {surface: this});
      setTimeout(function() {
        self.rerenderDomSelection();
      });
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handling Dead-keys under OSX
  this.onCompositionStart = function() {
    // just tell DOM observer that we have everything under control
    this.skipNextObservation = true;
  };

  // a shim for textInput events based on keyPress and a horribly dangerous dance with the CE
  this.onTextInputShim = function( e ) {
    if (this.frozen) {
      return;
    }
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
      this.editor.insertText(character, sel, {surface: this, source: el, typing: true});
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

  this.handleUpOrDownArrowKey = function ( e ) {
    var self = this;
    window.setTimeout(function() {
      self._updateModelSelection({
        up: (e.keyCode === Surface.Keys.UP),
        down: (e.keyCode === Surface.Keys.DOWN)
      });
    });
  };

  this.handleEnterKey = function( e ) {
    e.preventDefault();
    var selection = this.domSelection.get();
    var el = DomSelection.getDomNodeForPath(this.element, selection.range.start.path);
    if (e.shiftKey) {
      this.editor.softBreak(selection, {surface: this, source: el});
    } else {
      this.editor.break(selection, {surface: this, source: el});
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
      this.editor.delete(sel, direction, {surface: this, source: el, typing: true});
    } else {
      e.preventDefault();
      this.editor.delete(sel, direction, {surface: this});
    }
  };

  // ###########################################
  // Mouse Handling
  //

  this.onMouseDown = function(e) {
    if (this.frozen) {
      this.unfreeze();
    }
    if ( e.which !== 1 ) {
      return;
    }
    // Bind mouseup to the whole document in case of dragging out of the surface
    this.dragging = true;
    this.$document.on( 'mouseup', this._onMouseUp );
    this.$document.on( 'mousemove', this._onMouseMove );
  };

  this.onMouseUp = function(/*e*/) {
    // ... and unbind the temporary handler
    this.$document.off( 'mouseup', this._onMouseUp );
    this.$document.off( 'mousemove', this._onMouseMove );
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

  // There is now a problem with non-editable elements at the boundary
  // of elements, as illustrated by this example:
  //
  //  <div>
  //    <label contenteditable="false">Label:</label>
  //    <span>Value</span>
  //  </div>
  //
  // CE allows to set the cursor before the label, and without intervention
  // would even allow to delete it.
  // Particularly in FormEditors we could solve this by making
  // only the text-properties editable.

  // TODO: native blur and focus does only work if the root element
  // is contenteditable.

  this.onBlur = function() {
    // set this when you want to deabug selection related issues
    // otherwise the developer console will draw the focus, which
    // leads to an implicit deselection in the surface.
    if (!Substance.Surface.DISABLE_BLUR && !this.frozen) {
      console.log('Blurring surface', this.name, this.__id__);
      this.isFocused = false;
      this.setSelection(Substance.Document.nullSelection);
    }
  };

  this.onFocus = function() {
    console.log('Focusing surface', this.name, this.__id__);
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
    this.domSelection.set(this.getSelection());
  };

  this.getDomNodeForId = function(nodeId) {
    return this.element.querySelector('*[data-id='+nodeId+']');
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
      this.rerenderDomSelection();
    }
  };

  this.getLogger = function() {
    return this.logger;
  };

  this.placeCaretElement = function() {
    var sel = this.editor.selection;
    if (sel.isNull()) {
      throw new Error('Selection is null.');
    }
    var $caret = this.$caret;
    $caret.empty().remove();
    var pos = DomSelection.findDomPosition(this.element, sel.start.path, sel.start.offset);
    if (pos.node.nodeType === window.Node.TEXT_NODE) {
      var textNode = pos.node;
      if (textNode.length === pos.offset) {
        $caret.insertAfter(textNode);
      } else {
        // split the text node into two pieces
        var wsel = window.getSelection();
        var wrange = window.document.createRange();
        var text = textNode.textContent;
        var frag = window.document.createDocumentFragment();
        var textFrag = window.document.createTextNode(text.substring(0, pos.offset));
        frag.appendChild(textFrag);
        frag.appendChild($caret[0]);
        frag.appendChild(document.createTextNode(text.substring(pos.offset)));
        $(textNode).replaceWith(frag);
        wrange.setStart(textFrag, pos.offset);
        wsel.removeAllRanges();
        wsel.addRange(wrange);
      }
    } else {
      pos.node.appendChild($caret[0]);
    }
    return $caret;
  };

  this.removeCaretElement = function() {
    this.$caret.remove();
  };

  this.updateCaretElement = function() {
    this.$caret.remove();
    this.placeCaretElement();
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
