(function(exports) {

  // The Substance Namespace
  if (!exports.Substance) exports.Substance = {};

  var Composer = Dance.Performer.extend({
    el: 'container',

    events: {
      'click a.checkout-commit': '_checkoutCommit',
      'click a.new-document': '_newDocument'
    },

    _newDocument: function() {
      localStorage.removeItem('document');
      this.model = createSession();
      this.build();
      this.render();
      return false;
    },

    _checkoutCommit: function(e) {
      var sha = $(e.currentTarget).attr('data-commit');
      this.model.document.checkout(sha);
      this.views.document.build();
      this.render();
      return false;
    },

    initialize: function(options) {
      this.build();
    },

    // Handling keys
    // ---------------

    // Go up one level
    goBack: function() {
      var lvl = this.model.level();
      if (lvl === 3) {
        // Back to structure mode
        this.model.edit = false;
        $(".content-node .content").blur();
      }
      if (lvl === 2) {
        this.model.select([]);
      }
      this.views.document.updateMode();
    },

    handleDown: function() {
      // If in selection/structure mode
      if (this.model.level() === 2) { this.views.document.moveDown(); return false; }
    },

    handleUp: function() {
      // If in selection/structure mode
      if (this.model.level() === 2) { this.views.document.moveUp(); return false; }
    },

    handleShiftDown: function() {
      // Structure mode
      if (this.model.level() === 2) this.views.document.expandSelection();
    },

    handleShiftUp: function() {
      if (this.model.level() === 2) this.views.document.narrowSelection();
    },

    handleEnter: function() {
      console.log("current LEVEL", this.model.level());
      if (this.model.level() === 3) {
        var node = this.views.document.nodes[_.first(this.model.selection())];

        if (!_.include(["text", "section"], node.model.type)) return; // Skip for non-text nodes
        var text = node.surface.getText();
        var pos = node.surface.selection()[0]; // current cursor position

        var remainder = _.rest(text, pos).join("");
        var newContent = text.substr(0, pos);

        node.surface.setText(newContent);
        this.views.document.insertNode("text", {content: remainder});
        return false;
      }
    },

    handleBackspace: function() {
      if (this.model.level() === 2) {
        this.views.document.deleteNodes();
        return false;        
      }
    },

    build: function() {

      // Selection shortcuts
      key('shift+down', _.bind(function() { return this.handleShiftDown(); }, this));
      key('shift+up', _.bind(function() { return this.handleShiftUp(); }, this));
      key('esc', _.bind(function() { return this.goBack(); }, this));

      // Move shortcuts
      key('down', _.bind(function() { return this.handleDown(); }, this));
      key('up', _.bind(function() { return this.handleUp(); }, this));

      // Handle enter (creates new paragraphs)
      key('enter', _.bind(function() { return this.handleEnter(); }, this));

      // Handle backspace
      key('backspace', _.bind(function() { return this.handleBackspace(); }, this));

      // Node insertion shortcuts
      key('alt+t', _.bind(function() { this.views.document.insertNode("text", {}); return false }, this));
      key('alt+s', _.bind(function() { this.views.document.insertNode("section", {}); return false; }, this));

      // Possible modes: edit, view, patch, apply-patch
      this.mode = "edit";

      // Views
      this.views = {};

      this.views.document = new Substance.Composer.views.Document({ model: this.model });
      this.views.tools = new Substance.Composer.views.Tools({model: this.model });
      
      this.model.document.on('operation:applied', function() {
        // Refresh the tools
        this.views.tools.update();
        // Save snapshot of the document
        localStorage.setItem('document', JSON.stringify(this.model.document.toJSON()));
      }, this);

      this.model.on('node:select', function() {
        // Refresh the tools
        this.views.tools.update();
        console.log('node selected - tools rerendered');
      }, this);
    },

    render: function() {
      this.$el.html(_.tpl('composer'));
      this.renderDoc();
    },

    renderDoc: function() {
      this.$('#document').replaceWith(this.views.document.render().el);
      this.$('#tools').html(this.views.tools.render().el);
    }
  },
  
  // Class Variables
  {
    models: {},
    views: {},
    instructors: {},
    utils: {}
  });

  // Exports
  Substance.Composer = Composer;
  exports.Substance = Substance;
  exports.s = Substance;
  exports.sc = Substance.Composer;

})(window);