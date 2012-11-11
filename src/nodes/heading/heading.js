sc.views.Node.define('heading', {

  className: 'content-node heading',

  // This should be moved into a separate module
  events: {
    'click .annotation-tools .toggle': 'toggleAnnotation'
  },

  toggleAnnotation: function(e) {
    var type = $(e.currentTarget).attr('data-type');

    this.annotate(type);
    return false;
  },

  initialize: function (options) {
    sc.views.Node.prototype.initialize.apply(this, arguments);
  },

  focus: function () {
    console.log('is this method every called?');
    this.headerEl.click();
  },

  remove: function () {
    this.nodeList.remove();
    $(this.el).remove();
  },

  // Make this a toggling bitch
  annotate: function(type) {
    // Check for existing annotation
    var sel = this.surface.selection();
    var a = this.surface.getAnnotations(sel, [type])[0];

    // Overlap
    if (a) {
      var start = sel[0];
      var end = start + sel[1];
      var aStart = a.pos[0];
      var aEnd = aStart + a.pos[1];

      if (start <= aStart && end >= aEnd) {
        // Full overlap
        this.surface.deleteAnnotation(a.id);
      } else {
        if (start <= aStart) {
          // Partial overlap left-hand side
          this.surface.updateAnnotation({
            id: a.id,
            pos: [end, a.pos[1] - (end - a.pos[0])]
          });

        } else if (start < aEnd && end >= aEnd) {
          // Partial overlap right-hand side
          this.surface.updateAnnotation({
            id: a.id,
            pos: [a.pos[0], start - aStart]
          });
        } else {
          this.surface.deleteAnnotation(a.id);
        }
      }
    } else {
      // Insert new annotation
      this.insertAnnotation(type);
    }

    // this.removeToggles();
    this.renderToggles(sel);
  },

  insertAnnotation: function(type) {
    var id = "annotation:"+Math.uuid();
    this.surface.insertAnnotation({ id: id, type: type, pos: this.surface.selection() });
    choreographer.trigger('comment-scope:selected', id, this.model.id, id);
  },

  transitionTo: function (state) {
    sc.views.Node.prototype.transitionTo.call(this, state);
    if (this.state === state) {
      this.nodeList.transitionTo(state);
    }
  },

  initSurface: function() {
    var that = this;

    var annotations = app.view.model.document.annotations(this.model.id);

    this.surface = new Substance.Surface({
      el: this.$('.content')[0],
      content: this.model.content,
      annotations: annotations,
      types: {
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
      app.view.model.select([that.model.id], {edit: true});
    });

    function selectionChanged(sel) {
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

    this.surface.on('annotations:changed', function() {
      that.session.comments.updateAnnotations(that.surface.content, that.surface.annotations);
    });


    this.surface.on('content:changed', function(content, prevContent, ops) {
      var delta = _.extractOperation(prevContent, content);

      // Update content incrementally
      if (content !== prevContent) {
        that.document.apply(["update", {id: that.model.id, "data": delta}]);
      }
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

  render: function () {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
});