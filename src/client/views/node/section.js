Node.define('/type/section', {

  className: 'content-node section',

  initialize: function (options) {
    Node.prototype.initialize.apply(this, arguments);
    this.nodeList = new NodeList({
      model: this.model,
      level: options.level,
      root: this.root
    });
  },

  transitionTo: function (state) {
    StateMachine.transitionTo.call(this, state);
    this.nodeList.transitionTo(state);
  },

  //select: function () {},

  deselect: function () {
    Node.prototype.deselect.apply(this);
    this.nodeList.deselect();
  },

  render: function () {
    Node.prototype.render.apply(this, arguments);
    var level = Math.min(6, this.level);
    this.header = this.makeEditable($('<h'+level+' />'), 'name', "Enter Section Name").appendTo(this.contentEl);
    this.nodeListEl = $(this.nodeList.render().el).appendTo(this.contentEl);
    return this;
  }

});
