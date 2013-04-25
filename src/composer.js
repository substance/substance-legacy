(function(exports) {

  // The Substance Namespace
  if (!exports.Substance) exports.Substance = {};

  var Composer = Backbone.View.extend({
    events: {
      'click a.checkout-commit': '_checkoutCommit',
      'click .properties': 'clear',
      'click a.insert': '_insert',
      'click a.move.up': 'moveUp',
      'click a.move.down': 'moveDown',
      'click .content-node a.delete': 'handleBackspace'
    },

    _checkoutCommit: function(e) {
      var sha = $(e.currentTarget).attr('data-commit');
      this.model.document.checkout(sha);
      this.views.document.build();
      this.render();
      return false;
    },

    _insert: function(e) {
      var type = $(e.currentTarget).attr('data-type');
      this.views.document.insertNode(type, {});
      return false;
    },

    updateMode: function() {
      this.views.document.updateMode();
    },

    // Now obsolete for our fixed layout
    positionTools: function() {
      // var leftMargin = Math.max(100, ($(window).width()-1200) / 2);
      // this.$('#tools').css('left', leftMargin+800+'px');
    },

    initialize: function(options) {
      this.build();
      $(window).resize(this.positionTools);
    },

    // Handling keys
    // ---------------

    clear: function() {
      // HACK: ensures there are no remaining floating annotation controls
      $('.annotation-tools').hide();
      this.model.select([]);
      this.updateMode();
    },

    // Go up one level
    goBack: function() {
      var lvl = this.model.level();
      if (lvl === 2) return this.clear();

      this.model.edit = false;

      // TODO: Only deactivate currently active surface -> performance
      $(".content-node .content").blur();
      this.updateMode();
      return false;
    },

    handleDown: function() {
      // If in selection/structure mode
      if (this.model.level() <= 2) { this.views.document.selectNext(); return false; }
    },

    handleUp: function() {
      // If in selection/structure mode
      if (this.model.level() <= 2) { this.views.document.selectPrev(); return false; }
    },

    handleShiftDown: function() {
      // Structure mode
      if (this.model.level() === 2) this.views.document.expandSelection();
    },

    handleShiftUp: function() {
      if (this.model.level() === 2) this.views.document.narrowSelection();
    },

    moveDown: function() {
      this.views.document.moveDown();
      return false;
    },

    moveUp: function() {
      this.views.document.moveUp();
      return false;
    },

    handleAltDown: function() {
      // If in selection/structure mode
      if (this.model.level() === 2) return this.moveDown();
    },

    handleAltUp: function() {
      // If in selection/structure mode
      if (this.model.level() === 2) return this.moveUp();
    },

    handleEnter: function() {
      var that = this;
      if (this.model.level() === 3) {
        var node = this.views.document.nodes[_.first(this.model.selection())];
        
        if (!_.include(["text", "heading", "code"], node.model.type)) return; // Skip for non-text nodes

        if (node.model.type === "code") {
          node.surface.addNewline();
        } else {
          var text = node.surface.content;
          var pos = node.surface.selection()[0]; // current cursor position

          var remainder = _.rest(text, pos).join("");
          var newContent = text.substr(0, pos);

          node.surface.deleteRange([pos, remainder.length]);
          node.surface.commit();
          that.views.document.insertNode("text", {content: remainder, target: node.model.id});
        }

        return false;
      }
    },

    handleTab: function(reverse) {
      var that = this;
      if (this.model.level() === 3) {
        var node = this.views.document.nodes[_.first(this.model.selection())];
        
        if (node.model.type === "heading") {
          var level = node.model.level;

          if (!level) level = 1;
          if (reverse) {
            level = Math.max(level-1, 1);
          } else {
            level = Math.min(level+1, 3);
          }

          that.model.document.apply(["update", {id: node.model.id, "data": {
            "level": level
          }}]);

          $(node.el).removeClass('level-1')
                    .removeClass('level-2')
                    .removeClass('level-3');

          $(node.el).addClass('level-'+level);

          return false;
        }
        return false;
      }
    },

    handleBackspace: function() {
      if (this.model.level() === 2) {
        this.views.document.deleteNodes();
        return false;
      }
    },

    toggleAnnotation: function(type) {
      if (this.model.level() === 3) {
        var node = this.views.document.nodes[this.model.selection()[0]];
        node.annotate(type);
        return false;
      }
    },

    undo: function() {
      this.model.select([]); // Deselect
      this.model.document.undo();
      this.init();
      this.render();
      return false;
    },

    redo: function() {
      this.model.select([]); // Deselect
      this.model.document.redo();
      this.init();
      this.render();
      return false;
    },

    build: function() {
      // Selection shortcuts
      key('down', _.bind(function() { return this.handleDown(); }, this));
      key('up', _.bind(function() { return this.handleUp(); }, this));

      key('shift+down', _.bind(function() { return this.handleShiftDown(); }, this));
      key('shift+up', _.bind(function() { return this.handleShiftUp(); }, this));
      key('esc', _.bind(function() { return this.goBack(); }, this));

      // Move shortcuts
      key('alt+down', _.bind(function() { return this.handleAltDown(); }, this));
      key('alt+up', _.bind(function() { return this.handleAltUp(); }, this));

      // Handle enter (creates new paragraphs)
      key('enter', _.bind(function() { return this.handleEnter(); }, this));

      // Handle backspace
      key('backspace', _.bind(function() { return this.handleBackspace(); }, this));

      // Node insertion shortcuts
      key('alt+t', _.bind(function() { this.views.document.insertNode("text", {}); return false }, this));
      key('alt+h', _.bind(function() { this.views.document.insertNode("heading", {}); return false; }, this));

      // Marker shortcuts  
      key('⌘+i', _.bind(function() { return this.toggleAnnotation('em'); }, this));
      key('⌘+b', _.bind(function() { return this.toggleAnnotation('str'); }, this));
      key('ctrl+1', _.bind(function() { return this.toggleAnnotation('idea'); }, this));
      key('ctrl+2', _.bind(function() { return this.toggleAnnotation('blur'); }, this));
      key('ctrl+3', _.bind(function() { return this.toggleAnnotation('doubt'); }, this));

      key('⌘+z', _.bind(function() { return this.undo(); }, this));
      key('shift+⌘+z', _.bind(function() { return this.redo(); }, this));

      key('tab', _.bind(function() { return this.handleTab(); }, this));
      key('shift+tab', _.bind(function() { return this.handleTab(true); }, this));

      // Possible modes: edit, view, patch, apply-patch
      this.mode = "edit";

      this.init();
    },

    init: function() {
      // Views
      this.views = {};

      this.views.document = new Substance.Composer.views.Document({ model: this.model });
      this.views.tools = new Substance.Composer.views.Tools({model: this.model });

      this.model.document.on('commit:applied', function(commit) {
        // Send update to the server
        $('#header .sync').removeClass('disabled');
        
        // $('#header .sync .status').html('Sync');

        this.updateUndoRedoControls();
      }, this);

      
      this.model.document.on('ref:updated', function(ref, sha) {
        this.updateUndoRedoControls();
      }, this);
    },

    render: function() {
      var that = this;
      this.$el.html(_.tpl('composer'));
      this.renderDoc();
      this.positionTools();
      this.updateMode();

      _.delay(function() {
        that.updateUndoRedoControls();  
      }, 1);
      
      return this;
    },

    updateUndoRedoControls: function() {
      var head = this.model.document.getRef('master', 'head');
      var last = this.model.document.getRef('master', 'last');

      if (head === last) {
        $('#document_menu .redo').addClass('disabled');
      } else {
        $('#document_menu .redo').removeClass('disabled');
      }

      if (head === null) {
        $('#document_menu .undo').addClass('disabled');
      } else {
        $('#document_menu .undo').removeClass('disabled');
      }
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