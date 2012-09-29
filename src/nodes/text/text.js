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
    console.log('annotating text');
    this.surface.insertAnnotation({ id: "annotation:"+Math.uuid(), type: type, pos: this.surface.selection() });
    // To be overriden by concrete nodes
  },

  initSurface: function() {
    var that = this;

    var annotations = {};
    _.each(app.view.model.document.annotations.content.nodes, function(n) {
      if (n.node === that.model.id && n.type !== "comment") annotations[n.id] = n;
    });

    this.surface = new Substance.Surface({
      el: this.$('.content')[0],
      content: this.model.content,
      annotations: annotations
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

    this.surface.on('content:changed', function(content, prevContent, ops) {
      var delta = _.extractOperation(prevContent, content);

      console.log("Partial Text Update", delta);

      // Applying annotation ops...
      _.each(ops, function(op) {
          // add the node reference
          op[1].data.node = that.model.id;
          console.log('applying op', op);
          that.document.annotations.apply({
            op: op,
            user: "michael"
          });
      });

      if (content !== prevContent) {
        var op = {
          op: ["update", {id: that.model.id, "data": delta}],
          user: "michael"
        };

        that.document.apply(op);
      }
      
    });
  },

  render: function() {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
});