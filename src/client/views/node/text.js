s.views.Node.define('/type/text', {

  className: 'content-node text',

  focus: function () {
    $(this.textEl).click();
  },

  select: function () {
    s.views.Node.prototype.select.apply(this);
    this.$('.proper-commands').show();
  },

  deselect: function () {
    s.views.Node.prototype.deselect.apply(this);
    this.$('.proper-commands').hide();
  },

  render: function () {
    s.views.Node.prototype.render.apply(this, arguments);
    this.textEl = this.makeEditable(this.contentEl, 'content', "Enter Text", {
      markup: true,
      multiline: true,
      controlsTarget: $(this.el)
    });
    return this;
  }

});
