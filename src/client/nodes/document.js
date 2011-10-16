Node.define(['/type/document', '/type/article'], 'Document', {

  className: 'content-node document',

  initialize: function (options) {
    Node.prototype.initialize.apply(this, arguments);
    this.nodeList = new Node.NodeList({
      model: this.model,
      level: 1
    });
  },

  readonly: function () {
    this.nodeList.readonly();
  },

  readwrite: function () {
    this.nodeList.readwrite();
  },

  //select: function () {},

  deselect: function () {
    this.nodeList.deselect();
  },

  render: function () {
    Node.prototype.render.apply(this, arguments);
    this.titleEl  = $('<h1 />').text(this.model.get('title')).appendTo(this.contentEl);
    this.authorEl = $('<h2 />').text(this.model.get('creator').get('name')).appendTo(this.contentEl);
    this.leadEl   = $('<p />').text(this.model.get('lead')).appendTo(this.contentEl);
    this.nodeListEl = $(this.nodeList.render().el).appendTo(this.contentEl);
    return this;
  }

});
