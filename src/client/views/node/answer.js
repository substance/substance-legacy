s.views.Node.define('/type/answer', {

  className: 'content-node answer',

  focus: function () {
    this.answerEl.click();
  },

  render: function () {
    Node.prototype.render.apply(this, arguments);
    this.answerEl = this.makeEditable($('<p class="answer" />'), 'content', "Enter Answer", {
      markup: true,
      multiline: true
    }).appendTo(this.contentEl);
    return this;
  }

});
