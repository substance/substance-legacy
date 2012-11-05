sc.views.Node.define('heading', {

  className: 'content-node heading',

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

  annotate: function(type) {
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
    }

    // Update comments panel according to marker context
    this.surface.off('selection:changed', selectionChanged);
    this.surface.on('selection:changed', selectionChanged);

    this.surface.on('annotations:changed', function() {
      that.session.comments.updateAnnotations(that.surface.getContent(), that.surface.annotations);
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

  render: function () {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
});