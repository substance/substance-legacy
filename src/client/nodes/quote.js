Node.define('/type/quote', "Quote", {

  className: 'content-node quote',

  //initialize: function () {},

  render: function () {
    Node.prototype.render.apply(this);
    
    var blockquote = $('<blockquote />').appendTo(this.contentEl);
    this.quoteContentEl = this.makeEditable($('<p class="quote-content" />'), 'content', "Enter Quote").appendTo(blockquote);
    $('<br clear="both" />').appendTo(blockquote);
    this.quoteAuthorEl  = this.makeEditable($('<cite class="quote-author" />'), 'author', "Enter Author").appendTo(blockquote);
    
    this.header = this.makeEditable($('<h'+level+' />'), 'name', "Enter Section Name").appendTo(this.contentEl);
    
    return this;
  }

});
