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

  transitionTo: function (state) {
    sc.views.Node.prototype.transitionTo.call(this, state);
    if (this.state === state) {
      this.nodeList.transitionTo(state);
    }
  },

  initSurface: function() {
    var that = this;

    this.surface = new Substance.Surface({
      el: this.$('.content')[0],
      content: this.model.content
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

    this.surface.on('content:changed', function(content, prevContent) {
      var delta = _.extractOperation(prevContent, content);

      console.log("Partial Text Update", delta);

      var op = ["update", {id: that.model.id, "data": delta}];
      that.document.apply(op, {user: "michael"});
    });
  },

  render: function () {
    sc.views.Node.prototype.render.apply(this, arguments);
    this.initSurface();
    return this;
  }
});