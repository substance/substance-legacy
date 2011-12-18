s.views.Node.define('/type/quote', {

  className: 'content-node quote',

  focus: function () {
    this.quoteContentEl.click();
  },

  render: function () {
    s.views.Node.prototype.render.apply(this);
    
    var blockquoteEl = $('<blockquote />').appendTo(this.contentEl);
    this.quoteContentEl = this.makeEditable($('<p class="quote-content" />'), 'content', "Enter Quote")
      .appendTo($('<div />').appendTo(blockquoteEl));
    this.quoteAuthorEl  = this.makeEditable($('<cite class="quote-author" />'), 'author', "Enter Author")
      .appendTo($('<div />').appendTo(blockquoteEl));
    $('<br clear="both" />').appendTo(this.contentEl);
    
    return this;
  }

});
