"use strict";

var Substance = require('../basics');

// context must have a getSurface() method.
var Clipboard = function(surfaceManager, htmlImporter, htmlExporter) {

  this.surfaceManager = surfaceManager;
  this.htmlImporter = htmlImporter;
  this.htmlExporter = htmlExporter;

  this._contentDoc = null;
  this._contentText = "";

  this._onKeyDown = Substance.bind(this.onKeyDown, this);
  this._onCopy = Substance.bind(this.onCopy, this);
  this._onCut = Substance.bind(this.onCut, this);

  this.isIe = (window.navigator.userAgent.toLowerCase().indexOf("msie") != -1 || window.navigator.userAgent.toLowerCase().indexOf("trident") != -1);
  this.isFF = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  if (this.isIe) {
    this._beforePasteShim = Substance.bind(this.beforePasteShim, this);
    this._pasteShim = Substance.bind(this.pasteShim, this);
  } else {
    this._onPaste = Substance.bind(this.onPaste, this);
  }

};

Clipboard.Prototype = function() {

  this.getSurface = function() {
    return this.surfaceManager.getFocussedSurface();
  };

  this.attach = function(rootElement) {
    this.el = window.document.createElement('div');
    this.$el = $(this.el);
    this.$el.prop("contentEditable", "true").addClass('clipboard');
    rootElement.appendChild(this.el);

    rootElement.addEventListener('keydown', this._onKeyDown, false);
    rootElement.addEventListener('copy', this._onCopy, false);
    rootElement.addEventListener('cut', this._onCut, false);

    if (this.isIe) {
      rootElement.addEventListener('beforepaste', this._beforePasteShim, false);
      rootElement.addEventListener('paste', this._pasteShim, false);
    } else {
      rootElement.addEventListener('paste', this._onPaste, false);
    }
  };

  this.detach = function(rootElement) {
    this.$el.remove();

    rootElement.removeEventListener('keydown', this._onKeyDown, false);
    rootElement.removeEventListener('copy', this._onCopy, false);
    rootElement.removeEventListener('cut', this._onCut, false);
    if (this.isIe) {
      rootElement.removeEventListener('beforepaste', this._beforePasteShim, false);
      rootElement.removeEventListener('paste', this._pasteShim, false);
    } else {
      rootElement.removeEventListener('paste', this._onPaste, false);
    }
  };

  this.onCopy = function(event) {
    console.log("Clipboard.onCopy", arguments);
    this._copySelection();
    if (event.clipboardData && this._contentDoc) {
      var html = this.htmlExporter.convert(this._contentDoc);
      console.log('Stored HTML in clipboard', html);
      this._contentDoc.__id__ = Substance.uuid();
      var data = this._contentDoc.toJSON();
      data.__id__ = this._contentDoc.__id__;
      event.clipboardData.setData('application/substance', JSON.stringify(data));
      event.clipboardData.setData('text/plain', $(html).text());
      event.clipboardData.setData('text/html', html);
      event.preventDefault();
    }
  };

  // nothing special for cut.
  this.onCut = function(e) {
    e.preventDefault();
    console.log("Clipboard.onCut", arguments);
    this.onCopy(e);
    var surface = this.getSurface();
    if (!surface) return;
    var editor = surface.getEditor();
    surface.transaction(function(tx, args) {
      return editor.delete(tx, args);
    });
  };

  this.pasteSubstanceData = function(data) {
    var surface = this.getSurface();
    if (!surface) return;
    var editor = surface.getEditor();
    var logger = surface.getLogger();
    var doc = surface.getDocument();
    // try {
      var content = doc.fromSnapshot(JSON.parse(data));
      var plainText = "";
      var pasteContent = content.get('content');
      if (pasteContent.nodes.length > 0) {
        var first = pasteContent.getFirstComponent();
        var last = pasteContent.getLastComponent();
        var lastLength = content.get(last.path).length;
        var sel = doc.createSelection({
          type: 'container',
          containerId: 'content',
          startPath: first.path,
          startOffset: 0,
          endPath: last.path,
          endOffset: lastLength
        });
        plainText = content.getTextForSelection(sel);
      }
      surface.transaction(function(tx, args) {
        args.text = plainText;
        args.doc = content;
        return editor.paste(tx, args);
      });
    // } catch (error) {
    //   console.error(error);
    //   logger.error(error);
    // }
  };

  this.pasteHtml = function(html) {
    var surface = this.getSurface();
    if (!surface) return;
    var editor = surface.getEditor();
    var logger = surface.getLogger();
    var doc = surface.getDocument();
    try {
      var content = doc.newInstance();
      if (!content.get('content')) {
        content.create({
          id: 'content',
          type: 'container',
          nodes: []
        });
      }
      var htmlDoc = new window.DOMParser().parseFromString(html, "text/html");
      this.htmlImporter.convert($(htmlDoc), content);
      surface.transaction(function(tx, args) {
        args.text = htmlDoc.body.textContent;
        args.doc = content;
        return editor.paste(tx, args);
      });
    } catch (error) {
      console.error(error);
      logger.error(error);
    }
  };

  // Works on Safari/Chrome/FF
  this.onPaste = function(e) {
    var clipboardData = e.clipboardData;
    var surface = this.getSurface();
    if (!surface) return;
    var editor = surface.getEditor();
    var logger = surface.getLogger();
    var types = {};
    for (var i = 0; i < clipboardData.types.length; i++) {
      types[clipboardData.types[i]] = true;
    }

    // HACK: FF does not provide HTML coming in from other applications
    // so fall back to the paste shim
    if (this.isFF && !types['application/substance'] && !types['text/html']) {
      var sel = editor.selection;
      this.beforePasteShim();
      surface.rerenderSelection();
      this.pasteShim();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    console.log('Available types', types);
    if (types['application/substance']) {
      this.pasteSubstanceData(clipboardData.getData('application/substance'));
    } else if (types['text/html']) {
      this.pasteHtml(clipboardData.getData('text/html'));
    } else {
      try {
        var plainText = clipboardData.getData('text/plain');
        surface.transaction(function(tx, args) {
          args.text = plainText;
          return editor.insertText(tx, args);
        });
      } catch (error) {
        console.error(error);
        logger.error(error);
      }
    }
  };

  this.beforePasteShim = function() {
    console.log("Paste before...");
    this.$el.focus();
    var range = document.createRange();
    range.selectNodeContents(this.el);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  this.pasteShim = function() {
    // var clipboardData = window.clipboardData;
    // var clipboardText = clipboardData.getData('Text');
    this.$el.empty();
    var self = this;
    // FIXME: it seems that we had the problem of loosing the selection
    // is it really necessary anymore?
    var surface = this.getSurface();
    if (!surface) return;
    var sel = surface.getSelection();
    setTimeout(function() {
      surface.setSelection(sel);
      self.pasteHtml(self.$el.html());
      self.$el.empty();
    }, 0);
  };

  this.onKeyDown = function(e) {
    if (e.keyCode === 88 && (e.metaKey||e.ctrlKey)) {
      // console.log('Handle cut');
      // this.handleCut();
      // e.preventDefault();
      // e.stopPropagation();
    }
    else if (e.keyCode === 86 && (e.metaKey||e.ctrlKey)) {
      // console.log('Handle paste');
      this.handlePaste();
      // e.preventDefault();
      // e.stopPropagation();
    }
    else if (e.keyCode === 67 && (e.metaKey||e.ctrlKey)) {
      // console.log('Handle copy');
      // this.handleCopy(e);
      // e.preventDefault();
      // e.stopPropagation();
    }
  };

  this.handleCut = function() {
    console.log("Cutting into Clipboard...");
    var wSel = window.getSelection();
    // TODO: deal with multiple ranges
    // first extract the selected content into the hidden element
    var wRange = wSel.getRangeAt(0);
    var frag = wRange.cloneContents();
    this.el.innerHTML = "";
    this.el.appendChild(frag);
    this._copySelection();
    var surface = this.getSurface();
    if (!surface) return;
    try {
      console.log("...selection before deletion", surface.getSelection().toString());
      surface.getEditor().delete();
    } catch (error) {
      console.error(error);
      this.logger.error(error);
      return;
    }
    // select the copied content
    var wRangeNew = window.document.createRange();
    wRangeNew.selectNodeContents(this.el);
    wSel.removeAllRanges();
    wSel.addRange(wRangeNew);

    // hacky way to reset the selection which gets lost otherwise
    window.setTimeout(function() {
      // console.log("...restoring the selection");
      surface.rerenderDomSelection();
    }, 10);
  };

  this.handlePaste = function() {
  };

  this.handleCopy = function() {
    // Nothing here
  };

  this._copySelection = function() {
    var wSel = window.getSelection();
    this._contentText = "";
    this._contentDoc = null;
    var surface = this.getSurface();
    var sel = surface.getSelection();
    var editor = surface.getEditor();
    var doc = surface.getDocument();
    if (wSel.rangeCount > 0 && !sel.isCollapsed()) {
      var wRange = wSel.getRangeAt(0);
      this._contentText = wRange.toString();
      this._contentDoc = editor.copy(doc, sel);
      console.log("Clipboard._copySelection(): created a copy", this._contentDoc);
    } else {
      this._contentDoc = null;
      this._contentText = "";
    }
  };

};

Substance.initClass(Clipboard);

module.exports = Clipboard;
