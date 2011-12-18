s.views.Node.define('/type/question', {

  className: 'content-node question',

  focus: function () {
    this.questionEl.click();
  },

  render: function () {
    Node.prototype.render.apply(this, arguments);
    this.questionEl = this.makeEditable($('<p class="question" />'), 'content', "Enter Question").appendTo(this.contentEl);
    return this;
  }

});
