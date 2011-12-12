describe("Section", function () {
  var doc, node, child, view, name, root;

  beforeEach(function () {
    doc = createTestDocument();
    node = createNode('/type/section', new Position(doc, null));
    name = "The Substance Project";
    node.set({
      name: name
    });
    child = createNode('/type/text', new Position(node, null));
    child.set({
      content: "Substance has been started in 2010 by Michael Aufreiter."
    });
    root = Node.create({ model: doc });
    spyOn(root, 'deselect');
    view = Node.create({
      model: node,
      parent: doc,
      level: 1,
      root: root
    }).render();
    $(view.el).appendTo(document.body);
  });

  afterEach(function () {
    $(view.el).remove();
    delete window.graph;
  });

  it("should create a NodeList subview", function () {
    var nl = view.nodeList;
    expect(nl instanceof NodeList).toBe(true);
    expect(nl.level).toBe(1);
    expect(nl.root).toBe(root);
  });

  describe("State", function () {
    it("should transition the NodeList child view", function () {
      expect(view.state).toBe('read');
      expect(view.nodeList.childViews[0].state).toBe('read');
      view.transitionTo('move');
      expect(view.state).toBe('move');
      expect(view.nodeList.childViews[0].state).toBe('move');
      view.transitionTo('moveTarget');
      expect(view.state).toBe('move');
      expect(view.nodeList.childViews[0].state).toBe('move');
    });
  });

  it("should render the section name and all child nodes", function () {
    expect(view.$('h1').text()).toBe(name);
    expect(view.$('.node-list .content-node.text').text()).toMatch(/Substance has/);
  });

  describe("focus", function () {
    it("should focus the header element", function () {
      view.transitionTo('write');
      expect(view.$('h1').is(':focus')).toBe(false);
      view.focus();
      expect(view.$('h1').is(':focus')).toBe(true);
    });
  });

  it("should have an editable name", function () {
    testIsEditable(view, 'h1');
  });

});
