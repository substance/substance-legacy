sc.views.Node.define('text', {

  className: 'content-node text',

  // This should be moved into a separate module
  events: {
    'click .annotation-tools .toggle': 'toggleAnnotation'
  },

  toggleAnnotation: function(e) {
    var type = $(e.currentTarget).attr('data-type');

    // Check for existing annotation
    var sel = this.surface.selection();
    var a = this.surface.getAnnotations(sel, [type])[0];

    // Overlap
    if (a) {
      if (_.isEqual(sel, a.pos)) {
        // Full overlap
        this.surface.deleteAnnotation(a.id);
      } else {
        // Partial overlap, update annotation
        // For now do nothing
      }
    } else {
      // Insert new annotation
      this.annotate(type);
    }

    // this.removeToggles();
    this.renderToggles(sel);
    return false;
  },

  focus: function () {
    $(this.textEl).click();
  },

  select: function () {
    sc.views.Node.prototype.select.apply(this);
  },

  deselect: function () {
    sc.views.Node.prototype.deselect.apply(this);
  },

  // Deal with incoming update
  update: function() {
    // this.editor.setValue(this.model.content);
  },

  // Make this a toggling bitch
  annotate: function(type) {
    var id = "annotation:"+Math.uuid();
    this.surface.insertAnnotation({ id: id, type: type, pos: this.surface.selection() });
    choreographer.trigger('comment-scope:selected', id, this.model.id, id);
  },

  initSurface: function() {
    var that = this;

    var annotations = app.view.model.document.annotations(this.model.id);

    this.surface = new Substance.Surface({
      el: this.$('.content')[0],
      content: this.model.content,
      annotations: annotations,
      types: {
        "em": {
          "inclusive": true,
          "visibility" : 'both'
        },
        "str": {
          "inclusive": true,
          "visibility" : 'both'
        },
        "idea": {
          "inclusive": false,
          "visibility" : 'both'
        },
        "blur": {
          "inclusive": false,
          "visibility" : 'both'
        },
        "doubt": {
          "inclusive": false,
          "visibility" : 'both'
        }
      }
    });

    // Events
    // ------
  
    // Hackish way to prevent node selection to be triggered two times
    this.$('.content').click(function() {
      return false;
    });

    this.surface.on('surface:active', function(sel) {
      that.session.select([that.model.id], {edit: true});
    });

    function selectionChanged() {
      var sel = that.surface.selection();
      var marker = that.surface.getAnnotations(sel, ["idea", "blur", "doubt"])[0];
      if (marker) {
        choreographer.trigger('comment-scope:selected', marker.id, that.model.id, marker.id);
        that.surface.highlight(marker.id);
      } else {
        choreographer.trigger('comment-scope:selected', 'node_comments', that.model.id, null);
        that.surface.highlight(null);
      }

      sel[1] > 0 ? that.renderToggles(sel) : that.removeToggles();
    }

    // Update comments panel according to marker context
    this.surface.off('selection:changed', selectionChanged);
    this.surface.on('selection:changed', selectionChanged);

    // This gets fired a lot on every keystroke but no longer for adding annotations
    this.surface.on('changed', function() {
      // that.session.comments.updateAnnotations(that.surface.getContent(), that.surface.annotations);
    });

    this.$('.content').bind('blur', function() {
      console.log('surface deactivated');
      // that.removeToggles();
    });

    this.surface.on('annotations:changed', function() {
      that.session.comments.updateAnnotations(that.surface.getContent(), that.surface.annotations);
    });

    // Changes are confirmed.
    this.surface.on('content:changed', function(content, prevContent, ops) {

      var delta = _.extractOperation(prevContent, content);

      // console.log('Partial text update', delta);

      // Update content incrementally
      if (content !== prevContent) {
        var op = ["update", {id: that.model.id, "data": delta}];
        that.document.apply(op);
      }

      // console.log('annotation ops', ops);

      // Applying annotation ops...
      _.each(ops, function(op) {
        op[0] += "_annotation"; // should be done on the surface level?
        op[1].node = that.model.id;
        that.document.apply(op, {user: "michael"});
      });
    });
  },

  removeToggles: function() {
    this.$('.annotation-tools').empty();
  },

  renderToggles: function(sel) {
    var that = this;

    // Find last char
    var lastChar = this.$('.content').children()[sel[0]+sel[1]-1];

    // Calculate active states
    // Full overlap = active
    // Partial overlap = active
    var annotations = [
      {"type": "em", "active": false },
      {"type": "str", "active": false },
      {"type": "idea", "active": false },
      {"type": "blur", "active": false },
      {"type": "doubt", "active": false }
    ];

    _.each(annotations, function(a) {
      var anns = that.surface.getAnnotations(sel, [a.type]);
      if (anns.length > 0) a.active = true;
    });

    // Render tools
    this.$('.annotation-tools').html(_.tpl('annotation_toggles', {
      "annotations": annotations
    }));

    // Position dem
    var pos = this.$(lastChar).position();
    pos.left += 10;
    this.$('.annotation-tools').css(pos);
  }, 

  render: function() {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
});