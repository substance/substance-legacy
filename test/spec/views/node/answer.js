describe("Answer", function () {
  var doc, node, view, content;

  beforeEach(function () {
    doc = createTestDocument();
    node = createNode('/type/answer', new Position(doc, null));
    content = "You have to click 'Turn syntax-highlighting on' in the 'Edit' menu.";
    node.set({
      content: content
    });
    view = s.views.Node.create({
      model: node,
      parent: doc,
      root: s.views.Node.create({ model: doc })
    }).render();
    $(view.el).appendTo(document.body);
  });

  afterEach(function () {
    $(view.el).remove();
    delete window.graph;
  });

  describe("render", function () {
    it("should display the answer", function () {
      expect($(view.el).find('.answer').text()).toBe(content);
    });
  });

  describe("focus", function () {
    it("should focus the node", function () {
      view.transitionTo('write');
      view.focus();
      expect($(view.el).find('.answer').is(':focus')).toBe(true);
    });
  });

  it("should be editable", function () {
    testIsEditable(view, '.answer');
  });
});
