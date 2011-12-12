describe("Question", function () {
  var doc, node, view, content;

  beforeEach(function () {
    doc = createTestDocument();
    node = createNode('/type/question', new Position(doc, null));
    content = "How can I turn syntax-highlighting on?";
    node.set({
      content: content
    });
    view = Node.create({
      model: node,
      parent: doc,
      root: Node.create({ model: doc })
    }).render();
    $(view.el).appendTo(document.body);
  });

  afterEach(function () {
    $(view.el).remove();
    delete window.graph;
  });

  describe("render", function () {
    it("should display the question", function () {
      expect($(view.el).find('.question').text()).toBe(content);
    });
  });

  describe("focus", function () {
    it("should focus the node", function () {
      view.transitionTo('write');
      view.focus();
      expect($(view.el).find('.question').is(':focus')).toBe(true);
    });
  });

  it("should be editable", function () {
    testIsEditable(view, '.question');
  });
});
