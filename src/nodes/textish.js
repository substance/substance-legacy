// Textish
// ----------
// 
// Shared for all text-ish content types (such as text and header)

Textish = {
  // Initialize Surface
  initSurface: function() {
    var that = this;
    var annos = app.view.model.document.find('annotations', this.model.id);

    var annotations = {};

    // Convert annotations to object format
    _.each(annos, function(a) {
      annotations[a.id] = a;
    });

    this.surface = new Substance.Surface({
      el: this.$('.content')[0],
      content: this.model.content,
      annotations: annotations,
      types: this.types
    });


    // Events
    // ------
  
    // Hackish way preventing node selection to be triggered two times
    this.$('.content').click(function() {
      return false;
    });

    // TODO: problematic since this is triggered when a toggle is being clicked.
    // this.$('.content').bind('blur', function(e) {
    //   // TODO: reactivate when problems with link URL input are solved
    //   // that.removeToggles();
    // });

    this.surface.on('surface:active', function(sel) {
      that.session.select([that.model.id], { edit: true });
    });

    function selectionChanged(sel) {
      var marker = that.surface.getAnnotations(sel, ["idea", "question", "error"])[0];

      if (marker) {
        router.trigger('comment-scope:selected', marker.id, that.model.id, marker.id);
        that.surface.highlight(marker.id);
      } else {
        router.trigger('comment-scope:selected', 'node_comments', that.model.id, null);
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
        that.document.apply(["update", {id: that.model.id, "data": {"content": delta}}]);
      }

      // Applying annotation ops...
      _.each(ops, function(op) {
        if (op[1].data) op[1].data.node = that.model.id;
        that.document.apply(op);
      });
    });
  },

  updateLink: function(e) {
    var annotation = $(e.currentTarget).attr('data-id');
    var url = $(e.currentTarget).val();
  
    this.surface.updateAnnotation({
      id: annotation,
      url: url
    });
    return false;
  },

  // This should be moved into a separate module
  toggleAnnotation: function(e) {
    var $el = $(e.currentTarget);
    var type = $el.attr('data-type');

    this.annotate(type);
    return false;
  },

  // Toggle a particular annotation (based on a selection)
  annotate: function(type) {
    // Check for existing annotation
    var sel = this.surface.selection();

    if (!sel) return;

    if (_.include(["emphasis", "strong", "code", "link"], type)) {
      var types = ["emphasis", "strong", "code", "link"];
    } else {
      var types = ["idea", "question", "error"];
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
          router.trigger('comment-scope:selected', a.id, this.model.id, a.id);
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
    var data = {
      id: id,
      type: type,
      pos: sel,
    };

    if (type === "link") {
      data.url = "http://www.example.com";
    }

    this.surface.insertAnnotation(data);

    if (_.include(["emphasis", "strong", "code", "link"], type)) return; // skip comment-scope selection
    router.trigger('comment-scope:selected', id, this.model.id, id);
  },
  
  removeToggles: function() {
    $('.annotation-tools').hide();
  },

  renderToggles: function(sel) {
    var that = this;
    // HACK: ensures there are no remaining floating annotation controls
    $('.annotation-tools').hide();

    // Find last char
    var lastChar = this.$('.content').children()[sel[0]+sel[1]-1];
    var annotations = [];
    var link = null;

    _.each(this.types, function(a, type) {
      var anns = that.surface.getAnnotations(sel, [type]);
      annotations.push({
        type: type,
        active: anns.length > 0, // Overlap or not
        description: a.description
      });

      if (type === "link" && anns.length) {
        link = {
          url: anns[0].url,
          id: anns[0].id
        }
      }
    });

    // Render tools
    this.$('.annotation-tools').html(_.tpl('annotation_toggles', {
      "annotations": annotations,
      "link": link
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