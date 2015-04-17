"use strict";

var Substance = require('../basics');

// context must have a getSurface() method.
var Clipboard = function(surfaceProvider, element, htmlImporter, htmlExporter) {

  this.surfaceProvider = surfaceProvider;
  this.htmlImporter = htmlImporter;
  this.htmlExporter = htmlExporter;

  this.el = element;
  this.el.setAttribute("contenteditable", "true");
  this.el.classList.add("clipboard");

  // bind a handler to invoke the pasting...
  this.el.onpaste = this.onPaste.bind(this);

  this._contentDoc = null;
  this._contentText = "";

  this._onKeyDown = Substance.bind(this.onKeyDown, this);
  this._onCopy = Substance.bind(this.onCopy, this);
  this._onCut = Substance.bind(this.onCut, this);
  this._onPaste = Substance.bind(this.onPaste, this);
};

Clipboard.Prototype = function() {

  this.attach = function(rootElement) {
    $(rootElement).on('keydown', this._onKeyDown);
    $(rootElement).on('copy', this._onCopy);
    $(rootElement).on('cut', this._onCut);
    $(rootElement).on('paste', this._onPaste);
  };

  this.detach = function(rootElement) {
    $(rootElement).off('keydown', this._onKeyDown);
    $(rootElement).off('copy', this._onCopy);
    $(rootElement).off('cut', this._onCut);
    $(rootElement).off('paste', this._onPaste);
  };

  this.getSurface = function() {
    return this.surfaceProvider.getSurface();
  };

  this.onCopy = function(e) {
    console.log("Clipboard.onCopy", arguments);
    var event = e.originalEvent;
    this._copySelection();
    if (event.clipboardData && this._contentDoc) {
      var html = this.htmlExporter.toHtml(this._contentDoc, { containers: ['content'] });
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
    console.log("Clipboard.onCut", arguments);
    this.onCopy();
    e.preventDefault();
  };

  this.onPaste = function($e) {
    console.log("Paste post-processing...", this.el);
    var self = this;
    var e = $e.originalEvent;
    var surface = this.getSurface();
    var editor = surface.getEditor();
    var doc = editor.getDocument();
    var logger = surface.getLogger();

    // Experimental: look into the clipboard data for HTML
    // and use this as preferred input

    // TODO: 1. Fix HTML pasting for internal content
    //  2. detect 'application/substance' and use for internal paste
    //  3. Precedence (in the presence of clipboardData):
    //    1. app/substance,
    //    2. HTML,
    //    3. plain text
    //  4. Legacy for IE and older browsers (using pasting trick)

    if (e.clipboardData) {
      var items = e.clipboardData.items;
      var substanceItem = null;
      var htmlItem = null;
      var plainTextItem = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type === "application/substance") {
          substanceItem = items[i];
        }
        if (items[i].type === "text/html") {
          htmlItem = items[i];
        }
        if (items[i].type === "text/plain") {
          plainTextItem = items[i];
        }
      }
      if (substanceItem) {
        substanceItem.getAsString(function(data) {
          console.log("Received Substance JSON via Clipboard", data);
          try {
            var content = doc.fromSnapshot(JSON.parse(data));
            editor.paste(editor.selection, {
              content: content,
              text: "" // TODO: doc.toPlainText()
            });
          } catch (error) {
            console.error(error);
            logger.error(error);
          }
        });
        e.preventDefault();
        return;
      }
      if (htmlItem) {
        htmlItem.getAsString(function(data) {
          // console.log("Received HTML via Clipboard", data);
          try {
            var content = doc.newInstance();
            var htmlDoc = new window.DOMParser().parseFromString(data, "text/html");
            self.htmlImporter.convertDocument(htmlDoc, content);
            editor.paste(editor.selection, {
              content: content,
              text: htmlDoc.body.textContent
            });
          } catch (error) {
            console.error(error);
            logger.error(error);
          }
        });
        e.preventDefault();
        return;
      }
      if (plainTextItem) {
        plainTextItem.getAsString(function(data) {
          try {
            editor.insertText(data, editor.selection);
          } catch (error) {
            console.error(error);
            self.logger.error(error);
          }
        });
        e.preventDefault();
        return;
      }
    }

    // If not processed above use the plain text implementation
    window.setTimeout(function() {
      // Checking if we are pasting internally, i.e., if we have copied a Substance document fragment
      // previously.
      // Note: The browser does not allow to control what is delivered into the native clipboard.
      // The only way to detect if the content in the native and the internal clipboard is
      // to compare the content literally.
      // TODO: add check if content is the same as in fragment
      var wRange = window.document.createRange();
      wRange.selectNode(self.el);
      var plainText = wRange.toString();
      if (plainText === self._contentText) {
        // console.log("This is a substance internal paste.");
        try {
          editor.paste(editor.selection, {
            content: self._contentDoc,
            text: plainText
          });
        } catch (error) {
          console.error(error);
          logger.error(error);
        }
      } else {
        try {
          editor.insertText(plainText, editor.selection);
        } catch (error) {
          console.error(error);
          logger.error(error);
        }
      }
      // clear the pasting area
      self.el.innerHTML = "";
    }, 10);
    e.preventDefault();
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
    // console.log("Cutting into Clipboard...");
    var wSel = window.getSelection();
    // TODO: deal with multiple ranges
    // first extract the selected content into the hidden element
    var wRange = wSel.getRangeAt(0);
    var frag = wRange.cloneContents();
    this.el.innerHTML = "";
    this.el.appendChild(frag);
    this._copySelection();
    var surface = this.getSurface();
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
    if (wSel.rangeCount > 0 && !sel.isCollapsed()) {
      var wRange = wSel.getRangeAt(0);
      this._contentText = wRange.toString();
      this._contentDoc = editor.copy(sel);
      console.log("Clipboard._copySelection(): created a copy", this._contentDoc);
    } else {
      this._contentDoc = null;
      this._contentText = "";
    }
  };

};

Substance.initClass(Clipboard);

module.exports = Clipboard;
