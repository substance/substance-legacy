'use strict';

var _ = require('../basics/helpers');
var OO = require('../basics/oo');
var PathAdapter = require('../basics/path_adapter');
var Data = require('../data');

// HACK: this is not the final version
var ContainerAnnotationIndex = function(doc) {
  this.doc = doc;
  this.indexes = {};
  this.containers = {};
  this.containerAnnotations = {};

  // connect with high-priority so that gets updated before any UI
  doc.connect(this, { "document:changed": this.onDocumentChange }, 1000);
};

ContainerAnnotationIndex.Prototype = function() {

  this.getFragments = function(path, containerName) {
    var index = this.indexes[containerName];
    if (index) {
      return index.get(path) || [];
    }
    return [];
  };

  this.reset = function() {
    this.indexes = {};
    this._initialize(this.doc.data);
  };

  // this.reset = function(data) {
  //   this.indexes = {};
  //   this._initialize(data);
  // };

  this._initialize = function(data) {
    _.each(data.getNodes(), function(node) {
      if (this.select(node)) {
        this.create(node, "isInitializing");
      }
    }, this);
    _.each(this.containers, function(container) {
      this.recompute(container.id);
    }, this);
  };

  this.select = function(node) {
    return (node.type === "container" || node.isInstanceOf('container_annotation'));
  };

  this.create = function(node, isInitializing) {
    if (node.type === "container") {
      this.containers[node.id] = node;
      this.indexes[node.id] = new PathAdapter.Arrays();
    } else if (node.isInstanceOf('container_annotation')) {
      var containerId = node.container;
      this.containerAnnotations[node.id] = node;
      if (!isInitializing) {
        this.recompute(containerId);
      }
    }
  };

  // this.delete = function(node) {
  //   if (node.type === "container") {
  //     delete this.containers[node.id];
  //     delete this.indexes[node.id];
  //   } else if (node.isInstanceOf('container_annotation')) {
  //     var containerId = node.container;
  //     delete this.containerAnnotations[node.id];
  //     this.recompute(containerId);
  //   }
  // };

  // this.update = function(node, path, newValue, oldValue) {
  //   /* jshint unused: false */
  //   if (node.type === "container") {
  //     this.recompute(node.id);
  //   } else if (node.isInstanceOf('container_annotation')) {
  //     var containerId = node.container;
  //     this.recompute(containerId);
  //   }
  // };

  this.recompute = function(containerId) {
    var container = this.containers[containerId];
    this.indexes[containerId] = new PathAdapter.Arrays();
    var index = this.indexes[containerId];
    _.each(this.containerAnnotations, function(anno) {
      var fragments = container.getAnnotationFragments(anno);
      _.each(fragments, function(frag) {
        index.add(frag.path, frag);
      });
    });
  };

  this.onDocumentChange = function(change) {
    var needsUpdate = false;
    var containers = {};
    var doc = this.doc;
    var schema = doc.getSchema();
    for (var i = 0; i < change.ops.length; i++) {
      var op = change.ops[i];
      if (op.isCreate() || op.isDelete()) {
        var nodeData = op.getValue();
        if (nodeData.type === "container") {
          containers[nodeData.id] = true;
          needsUpdate = true;
        } else if (schema.isInstanceOf(nodeData.type, "container-annotation")) {
          containers[nodeData.container] = true;
          needsUpdate = true;
        }
      } else {
        var nodeId = op.path[0];
        // skip updates on nodes which have been deleted by this change
        if (change.deleted[nodeId]) {
          continue;
        }
        var node = doc.get(nodeId);
        if (node.type === "container") {
          containers[node.id] = true;
          needsUpdate = true;
        } else if (node.isInstanceOf("container-annotation")) {
          containers[node.container] = true;
          needsUpdate = true;
        }
      }
    }
    if (needsUpdate) {
      _.each(containers, function(val, containerId) {
        this.recompute(containerId);
      }, this);
    }
  };

};

OO.inherit(ContainerAnnotationIndex, Data.Index);



module.exports = ContainerAnnotationIndex;

