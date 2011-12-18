s.views.Node.define('/type/section', {

  className: 'content-node section',

  initialize: function (options) {
    s.views.Node.prototype.initialize.apply(this, arguments);
    this.nodeList = new s.views.NodeList({
      model: this.model,
      level: options.level,
      root: this.root
    });
  },

  focus: function () {
    this.headerEl.click();
  },

  remove: function () {
    this.nodeList.remove();
    $(this.el).remove();
  },

  transitionTo: function (state) {
    s.views.Node.prototype.transitionTo.call(this, state);
    if (this.state === state) {
      this.nodeList.transitionTo(state);
    }
  },

  render: function () {
    s.views.Node.prototype.render.apply(this, arguments);
    var level = Math.min(6, this.level);
    this.headerEl = this.makeEditable($('<h'+level+' />'), 'name', "Enter Section Name").appendTo(this.contentEl);
    this.nodeListEl = $(this.nodeList.render().el).appendTo(this.contentEl);
    return this;
  }

});
