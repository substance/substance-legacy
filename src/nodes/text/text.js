sc.views.Node.define('text', {

  className: 'content-node text',

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

  annotate: function(type) {
    this.surface.insertAnnotation({ id: "annotation:"+Math.uuid(), type: type, pos: this.surface.selection() });
    // To be overriden by concrete nodes
  },

  initSurface: function() {
    var that = this;

    var annotations = app.view.model.document.getAnnotations(this.model.id);

    // TODO: don't use globals!
    // Use global event delegation
    var commentsView = function() {
      return app.view.composer.views.tools.views.tool;
    }

    if (Object.keys(annotations).length > 0) {
      console.log('annotations...', annotations);
    }

    this.surface = new Substance.Surface({
      el: this.$('.content')[0],
      content: this.model.content,
      annotations: annotations,
      types: {
        "em": {
          "inclusive": false
        },
        "comment": {
          "inclusive": false
        }
      }
    });

    // Events
    // ------

    // Returns all annotations matching that selection
    // this.surface.on('selection:change', function(sel) {
    //   console.log('selection:change', sel, that.surface.selection());
    // });
  
    // Hackish way to prevent node selection to be triggered two times
    this.$('.content').click(function() {
      return false;
    });

    this.surface.on('surface:active', function(sel) {
      app.view.model.select([that.model.id], {edit: true});
    });

    // Update comments panel according to marker context
    this.surface.on('selection:changed', function(sel) {
      var marker = that.surface.getAnnotations(sel, ["mark-1", "mark-2", "mark-3"])[0];
      if (marker) {
        // commentsView().activateCategory(marker.id);
        // Reach out to choreographer
        choreographer.trigger('comment-category:selected', marker.id);
      } else {
        // commentsView().activateCategory('node_comments');
        // Reach out to choreographer
        choreographer.trigger('comment-category:selected', 'node_comments');
      }
    });

    // This gets fired a lot (keystroke, add annotation etc)
    this.surface.on('changed', function() {
      // Feed comments view with new data
      var comments = commentsView();
      comments.model.categories = commentsForNode(that.document, that.model.id, that.surface.getContent(), that.surface.annotations);
      comments.render();
    });

    this.surface.on('content:changed', function(content, prevContent, ops) {
      var delta = _.extractOperation(prevContent, content);
      
      // console.log("Partial Text Update", delta);

      if (content !== prevContent) {
        var op = {
          op: ["update", {id: that.model.id, "data": delta}],
          user: "michael"
        };
        that.document.apply(op);
      }

      // Applying annotation ops...
      _.each(ops, function(op) {
        op[1].node = that.model.id;
        that.document.apply(op, {scope: "annotation", user: "michael"});
      });

      console.log('new state', that.document.model);
    });
  },

  render: function() {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
});