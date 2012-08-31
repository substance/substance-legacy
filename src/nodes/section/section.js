sc.views.Node.define('section', {

  className: 'content-node section',

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

  transitionTo: function (state) {
    sc.views.Node.prototype.transitionTo.call(this, state);
    if (this.state === state) {
      this.nodeList.transitionTo(state);
    }
  },

  initSurface: function() {
    var that = this;

    this.surface = new Substance.Surface({
      el: this.$('.content'),
      content: this.model.content
    });

    // Events
    // ------

    // Returns all annotations matching that selection
    this.surface.on('selection:change', function(sel) {
      console.log('selection:change', sel, that.surface.selection());
    });

    this.surface.on('surface:active', function(sel) {
      app.composer.model.select([that.model.id], {edit: true});
    });

    this.surface.on('text:change', function(content, prevContent) {
      var delta = _.extractOperation(prevContent, content);

      console.log("Partial Text Update", delta);

      var op = {
        op: ["update", {id: that.model.id, "delta": delta}],
        user: "michael"
      };
      that.document.apply(op);
    });
  },

  render: function () {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
});