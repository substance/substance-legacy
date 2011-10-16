/*
  <h{{heading_level}} class="content{{#empty}} empty{{/empty}}"{{#edit}} title="Click To Edit Section Name"{{/edit}}>
    {{^empty}}{{{name}}}{{/empty}}
    {{#empty}}&laquo; Enter Section Name &raquo;{{/empty}}
  </h{{heading_level}}>
*/


Node.define('/type/section', 'Section', {

  className: 'content-node section',

  initialize: function (options) {
    this.__super__.initialize.apply(this, arguments);
    this.nodeList = new Node.NodeList({
      model: this.model.get('children'),
      level: options.level
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
    this.__super__.render.apply(this, arguments);
    var level = Math.min(6, this.level);
    this.header = $('<h'+level+' />').text(this.model.get('name')).appendTo(this.contentEl);
    this.nodeListEl = $(this.nodeList.render().el).appendTo(this.contentEl);
    return this;
  }

});
