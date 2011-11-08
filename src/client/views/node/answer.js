Node.define('/type/answer', "Answer", {

  className: 'content-node answer',

  render: function () {
    Node.prototype.render.apply(this, arguments);
    this.header = this.makeEditable($('<p class="answer content" />'), 'content', "Enter Answer").appendTo(this.contentEl);
    return this;
  }

});
