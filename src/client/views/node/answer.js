Node.define('/type/answer', {

  className: 'content-node answer',

  render: function () {
    Node.prototype.render.apply(this, arguments);
    this.header = this.makeEditable($('<p class="answer content" />'), 'content', "Enter Answer", {
      markup: true,
      multiline: true
    }).appendTo(this.contentEl);
    return this;
  }

});
