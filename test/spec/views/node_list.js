describe("NodeList", function () {
  var doc, section, text, root, list;

  beforeEach(function () {
    window.graph = new Data.Graph(seed);
    
    doc = graph.set(null, _.extend(graph.get('/type/article').meta.template, {
      name: 'testing-doc',
      title: "Testing Doc"
    }));
    
    text = graph.set(null, {
      type: '/type/text',
      content: "The brick brown fox jumps over the lazy dog.",
      document: doc._id
    });
    doc.all('children').set(text._id, text, 0);
    
    section = graph.set(null, {
      type: '/type/section',
      name: "You have to read this!",
      document: doc._id
    });
    doc.all('children').set(section._id, section, 1);
    
    root = s.views.Node.create({ model: doc });
    
    list = new s.views.NodeList({
      level: 0,
      root: root,
      model: doc
    });
    
    $(list.render().el).appendTo(document.body);
  });

  afterEach(function () {
    list.remove();
    delete window.graph;
  });

  describe("initialize", function () {
    it("should save the level and root node", function () {
      expect(list.level).toBe(0);
      expect(list.root).toBe(root);
    });

    it("should create the first controls", function () {
      expect(list.firstControls instanceof s.views.Controls).toBe(true);
      expect(list.firstControls.root).toBe(root);
      expect(list.firstControls.model).toBe(doc);
      expect(list.firstControls.position.parent).toBe(doc);
      expect(list.firstControls.position.after).toBe(null);
    });

    it("should create the first childviews", function () {
      expect(_.isArray(list.childViews)).toBe(true);
      expect(list.childViews.length).toBe(2);
      expect(list.childViews[0] instanceof s.views.Node.subclasses['/type/text']).toBe(true);
      expect(list.childViews[1] instanceof s.views.Node.subclasses['/type/section']).toBe(true);
    });
  });

  describe("eachChildView", function () {
    it("should call the given function with each childview", function () {
      var iterator = jasmine.createSpy();
      list.eachChildView(iterator);
      expect(iterator).toHaveBeenCalled();
      expect(iterator.callCount).toBe(2);
      expect(iterator.mostRecentCall.args[0] instanceof s.views.Node.subclasses['/type/section']).toBe(true);
    });
  });

  describe("State", function () {
    it("should transition the first controls and all child views", function () {
      expect(list.firstControls.state).toBe('read');
      expect(list.childViews[0].state).toBe('read');
      list.transitionTo('write');
      expect(list.firstControls.state).toBe('write');
      expect(list.childViews[0].state).toBe('write');
    });
  });

  describe("createChildView", function () {
    it("should inherit settings from the list", function () {
      var resource = graph.set(null, {
        type: '/type/resource',
        caption: "This is the caption. Very interesting.",
        url: 'substance.jpg.to',
        document: doc._id
      });
      
      var childView = list.createChildView(resource);
      expect(childView.level).toBe(1);
      expect(childView.parent).toBe(doc);
      expect(childView.model).toBe(resource);
      expect(childView.root).toBe(root);
    });
  });

  describe("Adding nodes", function () {
    var quote;

    beforeEach(function () {
      quote = graph.set(null, {
        type: '/type/quote',
        content: "I Have a Dream",
        author: "Martin Luther King",
        document: doc._id
      });
      doc.all('children').set(quote._id, quote, 1);
      doc.trigger('added-child', quote, 1);
    });

    it("should update the childViews array", function () {
      expect(list.childViews.length).toBe(3);
      expect(list.childViews[1] instanceof s.views.Node.subclasses['/type/quote']).toBe(true);
      expect(list.childViews[1].state).toBe('write');
    });

    it("should update the dom", function () {
      var el = $(list.el);
      expect(el.find('> *').length).toBe(7);
      expect(el.find('> .controls').length).toBe(4);
      expect(el.text()).toMatch(/Dream/);
    });

    it("should select and focus the new view", function () {
      expect($(list.childViews[1].el).hasClass('selected')).toBe(true);
      expect($(list.childViews[1].el).find('.quote-content').is(':focus')).toBe(true);
    });
  });

  describe("Removing nodes", function () {
    it("should automatically update the com", function () {
      var el = $(list.el);
      expect(el.find('> *').length).toBe(5);
      text.trigger('removed');
      expect(el.find('> *').length).toBe(3);
      expect(el.find('> .controls').length).toBe(2);
    });
  });

  describe("render", function () {
    it("should render alternatingly controls and node views", function () {
      var el = $(list.el);
      expect(el.find('> *').length).toBe(5);
      expect(el.find('> .controls').length).toBe(3);
      expect(el.find('> .controls + * + .controls + * + .controls').length).toBe(1);
    });
  });
});
