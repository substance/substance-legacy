(function(root) { "use strict";

  var _ = root._;
  var Substance = root.Substance;
  var util = Substance.util;
  var Editor = Substance.Editor || {};

  // Substance.Editor.View
  // ==========================================================================
  // 
  // The Substance Document Editor

  var EditorView = function(controller) {
    Substance.View.call(this);

    this.controller = controller;

    
    // Surface
    // --------

    // A Substance.Document.Writer instance is provided by the controller
    this.surface = new Substance.Surface(this.controller.writer);
  };

  EditorView.Prototype = function() {

    // Rendering
    // --------
    //

    this.render = function(id) {
      var writer = this.controller.writer;

      this.$el.html(_.tpl('editor', this.controller));

      this.$('#document').html(this.surface.render().el);
      return this;
    };

    this.dispose = function(id) {
      this.surface.dispose();
    };
  };

  EditorView.Prototype.prototype = Substance.View.prototype;
  EditorView.prototype = new EditorView.Prototype();
  EditorView.prototype.constructor = EditorView;  

  Editor.View = EditorView;
  Substance.Editor = Editor;

})(this);
