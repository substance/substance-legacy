'use strict';

var OO = require('../basics/oo');
var Surface = require('./surface');

var SurfaceManager = function(doc) {
  this.doc = doc;
  this.surfaces = {};
  this.focussedSurface = null;
  doc.connect(this, { 'document:changed': this.onDocumentChange });
};

SurfaceManager.Prototype = function() {

  this.dispose = function() {
    this.doc.disconnect(this);
    this.surfaces = {};
  };

  this.createSurface = function(editor, options) {
    return new Surface(this, editor, options);
  };

  this.registerSurface = function(surface) {
    this.surfaces[surface.getName()] = surface;
  };

  this.unregisterSurface = function(surface) {
    if (this.focussedSurface === surface) {
      this.focussedSurface = null;
    }
    delete this.surfaces[surface.getName()];
  };

  this.hasSurfaces = function() {
    return Object.keys(this.surfaces).length > 0;
  };

  this.didFocus = function(surface) {
    if (this.focussedSurface) {
      this.focussedSurface._blur();
    }
    this.focussedSurface = surface;
  };

  this.getFocussedSurface = function() {
    return this.focussedSurface;
  };

  this.onDocumentChange = function(change, info) {
    if (info.replay) {
      var selection = change.after.selection;
      var surfaceId = change.after.surfaceId;
      var surface = this.surfaces[surfaceId];
      if (surface) {
        if (this.focussedSurface !== surface) {
          this.didFocus(surface);
        }
        surface.setSelection(selection);
      } else {
        console.warn('No surface with name', surfaceId);
      }
    }
  };
};

OO.initClass(SurfaceManager);

module.exports = SurfaceManager;
