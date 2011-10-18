Node.define(['/type/document', '/type/article'], 'Document', {

  className: 'content-node document',

  initialize: function (options) {
    Node.prototype.initialize.apply(this, arguments);
    this.nodeList = new Node.NodeList({
      model: this.model,
      level: 0,
      root: this
    });
  },

  readonly: function () {
    Node.prototype.readonly.apply(this);
    window.editor.deactivate();
    this.nodeList.readonly();
  },

  readwrite: function () {
    Node.prototype.readwrite.apply(this);
    this.nodeList.readwrite();
  },

  //select: function () {},

  deselect: function () {
    Node.prototype.deselect.apply(this);
    this.nodeList.deselect();
  },

  render: function () {
    Node.prototype.render.apply(this, arguments);
    var creator = this.model.get('creator')
    ,   publishedOn = this.model.get('published_on');
    this.titleEl     = this.makeEditable($('<div class="document-title content" />'), 'title', "Enter Title").appendTo(this.contentEl);
    this.authorEl    = $('<p class="author" />').text(creator.get('name') || creator.get('username')).appendTo(this.contentEl);
    this.publishedEl = $('<p class="published" />').text(publishedOn ? _.date(publishedOn) : '').appendTo(this.contentEl);
    this.leadEl      = this.makeEditable($('<p class="lead content" id="document_lead" />'), 'lead', "Enter Lead").appendTo(this.contentEl);
    $('<div class="document-separator" />').appendTo(this.contentEl);
    this.nodeListEl  = $(this.nodeList.render().el).appendTo(this.contentEl);
    return this;
  }

});
