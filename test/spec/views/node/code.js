describe("Code", function () {
  var doc, node, view, content, language;

  beforeEach(function () {
    doc = createTestDocument();
    node = createNode('/type/code', new Position(doc, null));
    content = "&lt;div class=&quot;wrapper&quot;&gt;\n"
            + "&lt;p&gt;Hallo Welt!&lt;/p&gt;\n"
            + "&lt;/div&gt;";
    language = 'html';
    spyOn(_, 'throttle').andCallFake(_.identity);
    node.set({
      content: content,
      language: language
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

  describe("focus", function () {
    it("should focus the CodeMirror instance", function () {
      expect($(view.codeMirror.getWrapperElement()).hasClass('CodeMirror-focused')).toBe(false);
      view.focus();
      expect($(view.codeMirror.getWrapperElement()).hasClass('CodeMirror-focused')).toBe(true);
    });
  });

  it("should display the code", function () {
    view.codeMirror.refresh(); // Actually insert CodeMirror into the DOM
    expect($(view.el).text()).toMatch(/<div class="wrapper">/);
    expect($(view.el).text()).toMatch(/Hallo Welt!/);
  });

  it("should change the language", function () {
    expect(view.codeMirror.getOption('mode')).toBe('htmlmixed');
    expect(view.$('option').length).toBe(view.languages.length);
    view.$('select').val('haskell').trigger('change');
    expect(view.codeMirror.getOption('mode')).toBe('haskell');
    expect(node.get('language')).toBe('haskell');
  });

  it("should escape the code before writing to the model", function () {
    view.codeMirror.setValue('<p>Hello World!</p>');
    expect(node.get('content')).toBe('&lt;p&gt;Hello World!&lt;/p&gt;');
  });

  describe("State", function () {
    it("should make the editor read-only in read state", function () {
      expect(view.codeMirror.getOption('readOnly')).toBe(true);
      view.transitionTo('write');
      expect(view.codeMirror.getOption('readOnly')).toBe(false);
      view.transitionTo('read');
      expect(view.codeMirror.getOption('readOnly')).toBe(true);
    });
  });

});
