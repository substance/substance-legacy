Node.define('/type/question', {

  className: 'content-node question',

  render: function () {
    Node.prototype.render.apply(this, arguments);
    this.header = this.makeEditable($('<p class="question content" />'), 'content', "Enter Question").appendTo(this.contentEl);
    return this;
  }

});
