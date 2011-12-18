s.views.Node.define('/type/text', {

  className: 'content-node text',

  focus: function () {
    $(this.textEl).click();
  },

  select: function () {
    Node.prototype.select.apply(this);
    this.$('.proper-commands').show();
  },

  deselect: function () {
    Node.prototype.deselect.apply(this);
    this.$('.proper-commands').hide();
  },

  render: function () {
    Node.prototype.render.apply(this, arguments);
    this.textEl = this.makeEditable(this.contentEl, 'content', "Enter Text", {
      markup: true,
      multiline: true,
      controlsTarget: $(this.el)
    });
    return this;
  }

});
