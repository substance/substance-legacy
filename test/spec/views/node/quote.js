describe("Quote", function () {
  var doc, node, view, content, author;

  beforeEach(function () {
    doc = createTestDocument();
    node = createNode('/type/quote', new Position(doc, null));
    content = "If you want to make peace with your enemy, you have to work with your enemy. Then he becomes your partner.";
    author = "Nelson Mandela"
    node.set({
      content: content,
      author: author
    });
    view = Node.create({
      model: node,
      parent: doc
    }).render();
    $(view.el).appendTo(document.body);
  });

  afterEach(function () {
    $(view.el).remove();
    delete window.graph;
  });

  describe("render", function () {
    it("should display the content and author", function () {
      expect($(view.el).find('.quote-content').text()).toBe(content);
      expect($(view.el).find('.quote-author').text()).toBe(author);
    });
  });

  describe("focus", function () {
    it("should focus the node", function () {
      view.transitionTo('write');
      view.focus();
      expect($(view.el).find('.quote-content').is(':focus')).toBe(true);
    });
  });

  it("should be editable", function () {
    testIsEditable(view, '.quote-content');
    testIsEditable(view, '.quote-author');
  });
});
