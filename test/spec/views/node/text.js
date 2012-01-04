describe("Text (node)", function () {
  var doc, node, view, content;

  beforeEach(function () {
    doc = createTestDocument();
    node = createNode('/type/text', new Position(doc, null));
    // from Moby Dick
    content = "<p>But it may possibly be conceived that, in the internal parts of the whale, in his anatomy—there, at least, we shall be able to hit the right classification. Nay; what thing, for example, is there in the Greenland whale's anatomy more striking than his baleen? Yet we have seen that by his baleen it is impossible correctly to classify the Greenland whale. And if you descend into the bowels of the various leviathans, why there you will not find distinctions a fiftieth part as available to the systematizer as those external ones already enumerated. What then remains? nothing but to take hold of the whales bodily, in their entire liberal volume, and boldly sort them that way. And this is the Bibliographical system here adopted; and it is the only one that can possibly succeed, for it alone is practicable. To proceed.</p>";
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
    it("should display the current text", function () {
      expect($(view.el).find('.content').html()).toBe(content);
    });
  });

  describe("focus", function () {
    it("should focus the node", function () {
      view.transitionTo('write');
      view.focus();
      expect($(view.el).find('.content').is(':focus')).toBe(true);
    });
  });

  describe("select and deselect", function () {
    it("should show and hide the editor commands", function () {
      var el = $(view.el);
      expect(el.find('.proper-commands').length).toBe(0);
      view.transitionTo('write');
      view.focus();
      expect(el.find('.proper-commands').length).toBe(1);
      view.deselect();
      expect(el.find('.proper-commands').css('display')).toBe('none');
      view.select();
      expect(el.find('.proper-commands').css('display')).not.toBe('none');
    });
  });
});
