Node.define([ '/type/document', '/type/article', '/type/story'
            , '/type/conversation', '/type/manual', '/type/qaa'
            ], 'Document', {

  className: 'content-node document',

  initialize: function (options) {
    Node.prototype.initialize.apply(this, arguments);
    this.nodeList = new NodeList({
      model: this.model,
      level: 0,
      root: this
    });
  },

  transitionTo: function (state) {
    StateMachine.transitionTo.call(this, state);
    this.nodeList.transitionTo(state);
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

}, {

  states: {
    write: {
      leave: function () {
        Node.states.write.leave.apply(this);
        window.editor.deactivate();
      }
    },
    moveTarget: {
      enter: function () {
        $('#document').addClass('move-mode');
      },
      leave: function () {
        delete this.movedNode;
        delete this.movedParent;
        $('#document').removeClass('move-mode');
      }
    }
  }

});
