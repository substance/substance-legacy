// Textish
// ----------
// 
// Shared for all text-ish content types (such as text and header)

Textish = {
  // Initialize Surface
  initSurface: function() {
    var that = this;

    var annotations = app.view.model.document.annotations(this.model.id);

    this.surface = new Substance.Surface({
      el: this.$('.content')[0],
      content: this.model.content,
      annotations: annotations,
      types: this.types
    });

    // Events
    // ------
  
    // Hackish way to prevent node selection to be triggered two times
    this.$('.content').click(function() {
      return false;
    });

    // TODO: problematic since this is triggered when a toggle is being clicked.
    this.$('.content').bind('blur', function(e) {
      that.removeToggles();
    });


    this.surface.on('surface:active', function(sel) {
      that.session.select([that.model.id], {edit: true});
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

    // Changes are confirmed.
    this.surface.on('content:changed', function(content, prevContent, ops) {

      var delta = _.extractOperation(prevContent, content);

      // Update content incrementally
      if (content !== prevContent) {
        that.document.apply(["update", {id: that.model.id, "data": delta}]);
      }

      console.log('annotation ops', ops);

      // Applying annotation ops...
      _.each(ops, function(op) {
        op[0] += "_annotation"; // should be done on the surface level?
        op[1].node = that.model.id;
        that.document.apply(op, {user: "michael"});
      });
    });
  },

  // This should be moved into a separate module
  toggleAnnotation: function(e) {
    // console.log('toggleannotation');
    var type = $(e.currentTarget).attr('data-type');
    this.annotate(type);
    return false;
  },

  // Toggle a particular annotation (based on a selection)
  annotate: function(type) {
    // Check for existing annotation
    var sel = this.surface.selection();

    if (!sel) return;

    if (_.include(["em", "str"], type)) {
      var types = ["em", "str"];
    } else {
      var types = ["idea", "blur", "doubt"];
    }

    var a = this.surface.getAnnotations(sel, types)[0];

    // Overlap
    if (a) {
      var start = sel[0];
      var end = start + sel[1];
      var aStart = a.pos[0];
      var aEnd = aStart + a.pos[1];

      if (start <= aStart && end >= aEnd) {
        // Full overlap
        if (a.type === type) {
          this.surface.deleteAnnotation(a.id);  
        } else {
          console.log('turning ', a.type, 'into ', type);
          this.surface.updateAnnotation({
            id: a.id,
            type: type
          });
          choreographer.trigger('comment-scope:selected', a.id, this.model.id, a.id);
        }
      } else {
        if (start <= aStart) {

          // Partial overlap left-hand side
          this.surface.updateAnnotation({
            id: a.id,
            pos: [end, a.pos[1] - (end - a.pos[0])],
          });
        } else if (start < aEnd && end >= aEnd) {
          // Partial overlap right-hand side
          this.surface.updateAnnotation({
            id: a.id,
            pos: [a.pos[0], start - aStart]
          });
        } else {
          // In the middle -> delete it
          this.surface.deleteAnnotation(a.id);
        }

        // If types differ create the new annotation
        if (a.type !== type) {
          console.log('inserting new stuff..');
          this.insertAnnotation(type, sel);
        }
      }
    } else {
      // Insert new annotation
      this.insertAnnotation(type, sel);
    }

    // this.removeToggles();
    this.renderToggles(sel);
  },

  // Create a new annotation with the given annotation type
  insertAnnotation: function(type, sel) {
    var id = "annotation:"+Math.uuid();
    this.surface.insertAnnotation({ id: id, type: type, pos: sel });
    choreographer.trigger('comment-scope:selected', id, this.model.id, id);
  },

  removeToggles: function() {
    $('.annotation-tools').hide();
  },

  renderToggles: function(sel) {
    var that = this;

    // Find last char
    var lastChar = this.$('.content').children()[sel[0]+sel[1]-1];

    var annotations = [];
    _.each(this.types, function(a, type) {
      var anns = that.surface.getAnnotations(sel, [type]);
      annotations.push({
        type: type,
        active: anns.length > 0, // Overlap or not
        description: a.description
      });
    });

    // Render tools
    this.$('.annotation-tools').html(_.tpl('annotation_toggles', {
      "annotations": annotations
    })).show();

    // Position dem
    var pos = this.$(lastChar).position();
    if (pos) {
      pos.left -= 110;
      pos.top -= 54;
      this.$('.annotation-tools').css(pos);      
    }
  }
};