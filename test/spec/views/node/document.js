describe("Document (node)", function () {
  var doc, child, view, name, root;

  beforeEach(function () {
    doc = createTestDocument();
    var user = graph.set('/user/foo', {
      type: '/type/user',
      name: "Catherina Foo"
    });
    doc.set({
      lead: "Testing is essential for finding bugs.",
      creator: '/user/foo'
    });
    child = createNode('/type/text', new Position(doc, null));
    child.set({
      content: "Substance has been started in 2010 by Michael Aufreiter."
    });
    view = Node.create({
      model: doc
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
    expect(nl.level).toBe(0);
    expect(nl.root).toBe(view);
  });

  it("shouldn't have comments or controls", function () {
    expect(view.comment).toBeUndefined();
    expect(view.afterControls).toBeUndefined();
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

    it("should have the class 'edit' in write state", function () {
      var el = $(view.el);
      spyOn(window.editor, 'deactivate');
      expect(el.hasClass('edit')).toBe(false);
      view.transitionTo('write');
      expect(el.hasClass('edit')).toBe(true);
      view.transitionTo('read');
      expect(window.editor.deactivate).toHaveBeenCalled();
      expect(el.hasClass('edit')).toBe(false);
    });

    it("should add the class 'move-mode' to #document in moveTarget mode", function () {
      var docEl = $('<div id="document" />').appendTo(document.body);
      view.movedNode = child;
      view.movedParent = doc;
      view.transitionTo('moveTarget');
      expect(docEl.hasClass('move-mode')).toBe(true);
      view.transitionTo('write');
      expect(docEl.hasClass('move-mode')).toBe(false);
      expect(view.movedNode).toBeUndefined();
      expect(view.movedParent).toBeUndefined();
      docEl.remove();
    });
  });

  it("should render the section name and all child nodes", function () {
    expect(view.$('.document-title').text()).toBe('Testing Doc');
    expect(view.$('.lead').text()).toMatch(/^Testing is essential/);
    expect(view.$('.author').text()).toBe('Catherina Foo');
    expect(view.$('.published').text()).toBe('');
    expect(view.$('.node-list .content-node.text').text()).toMatch(/Substance has/);
  });

  it("should have an editable title and lead", function () {
    testIsEditable(view, '.document-title');
    testIsEditable(view, '.lead');
  });

  it("should add a title to editable nodes in write mode on hover", function () {
    var ed = view.$('.document-title');
    ed.mouseover();
    expect(ed.attr('title')).toBeFalsy();
    view.transitionTo('write');
    ed.mouseover();
    expect(ed.attr('title')).toMatch(/click to edit/i);
    view.transitionTo('read');
    ed.mouseover();
    expect(ed.attr('title')).toBeFalsy();
  });

  describe("deselect", function () {
    it("should recursively call deselect", function () {
      spyOn(view.nodeList, 'deselect');
      spyOn(Node.prototype, 'deselect');
      view.deselect();
      expect(view.nodeList.deselect).toHaveBeenCalled();
      expect(Node.prototype.deselect).toHaveBeenCalled();
    });
  });
});
