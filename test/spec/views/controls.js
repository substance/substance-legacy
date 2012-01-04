describe("Controls", function () {

  var doc, text, section, subsection, root, controls;

  beforeEach(function () {
    window.graph = new Data.Graph(seed);
    
    doc = graph.set(null, _.extend(graph.get('/type/article').meta.template, {
      name: 'testing-doc',
      title: "Testing Doc"
    }));
    
    text = graph.set(null, {
      type: '/type/text',
      content: "Designers say that I shouldn't use lorem ipsum.",
      document: doc._id
    });
    doc.all('children').set(text._id, text, 0);
    
    section = graph.set(null, {
      type: '/type/section',
      name: "First section",
      document: doc._id
    });
    doc.all('children').set(section._id, section, 1);
    
    subsection = graph.set(null, {
      type: '/type/section',
      name: "Subsection",
      document: doc._id
    });
    section.all('children').set(subsection._id, subsection, 0);
    
    root = {
      transitionTo: jasmine.createSpy()
    };
    
    controls = new s.views.Controls({
      root: root,
      level: 1,
      position: new Position(doc, section)
    }).render();
  });

  afterEach(function () {
    delete window.graph;
  });

  describe("State", function () {
    it("should start in 'read' state", function () {
      expect(controls.state).toBe('read');
    });
    it("should render when it switches the state", function () {
      spyOn(controls, 'render');
      controls.transitionTo('moveTarget');
      expect(controls.render).toHaveBeenCalled();
    });
  });

  describe("Read state", function () {
    it("should have no content", function () {
      expect($(controls.el).html()).toBe('');
    });
  });

  describe("Write state", function () {
    beforeEach(function () { controls.transitionTo('write'); });

    it("should use 'possibleChildTypes' internally", function () {
      spyOn(window, 'possibleChildTypes').andCallThrough();
      controls.render();
      expect(possibleChildTypes).toHaveBeenCalled();
      expect(possibleChildTypes.mostRecentCall.args[1]).toBe(1);
    });

    it("should have links to insert content", function () {
      var el = $(controls.el);
      expect(el.html()).toMatch(/Insert Content/);
      expect(el.find('.actions > ul > li').length).toBe(possibleChildTypes(new Position(doc, section)).length);
      expect(el.find('ul ul').length).toBe(1);
      expect(el.find('ul ul').parent().text()).toMatch(/Section/);
      expect(el.find('ul ul li').length).toBe(3);
      expect(el.find('ul ul li').eq(1).text()).toMatch(/Level 2/);
    });
    
    it("should insert a new node at the correct position", function () {
      var el = $(controls.el);
      expect(subsection.all('children').length).toBe(0);
      el.find('ul ul li a').eq(2).click();
      expect(subsection.all('children').length).toBe(1);
      var subsubsection = subsection.all('children').at(0);
      expect(subsubsection.type.key).toBe('/type/section');
      controls.render();
      expect(subsubsection.all('children').length).toBe(0);
      el.find('a').filter(function (i, a) {
        return /Image/.exec($(a).text());
      }).click();
      expect(subsubsection.all('children').length).toBe(1);
      var image = subsubsection.all('children').at(0);
      expect(image.type.key).toBe('/type/image');
    });
  });

  describe("Move state", function () {
    beforeEach(function () { controls.transitionTo('move'); });

    it("should be visible, but have no content", function () {
      expect($(controls.el).html()).not.toBe('');
      expect($(controls.el).text()).toMatch(/\s*/);
    });
  });

  describe("MoveTarget state", function () {
    it("should move non-section nodes to the deepest section", function () {
      root.movedParent = doc;
      root.movedNode = text;
      controls.transitionTo('moveTarget');
      
      var el = $(controls.el);
      expect(el.text()).toMatch(/Move/);
      expect(el.find('ul ul').length).toBe(0);
      expect(el.find('a').length).toBe(1);
      expect(doc.all('children').length).toBe(2);
      expect(subsection.all('children').length).toBe(0);
      el.find('a').click();
      expect(doc.all('children').length).toBe(1);
      expect(subsection.all('children').length).toBe(1);
      expect(root.transitionTo).toHaveBeenCalledWith('write');
    });

    it("should let the user decide to which level to move sections", function () {
      var newSection = graph.set(null, {
        type: '/type/section',
        name: "New Section",
        document: doc._id
      });
      doc.set(newSection._id, newSection, 0);
      
      spyOn(window, 'moveTargetPositions').andCallThrough();
      
      root.movedParent = doc;
      root.movedNode = newSection;
      controls.transitionTo('moveTarget');
      
      expect(moveTargetPositions).toHaveBeenCalled();
      expect(moveTargetPositions.mostRecentCall.args[2]).toBe(1);
      
      var el = $(controls.el);
      expect(el.find('ul ul').length).toBe(1);
      expect(el.find('ul ul li').length).toBe(3);
      expect(el.find('ul ul li').eq(0).text()).toMatch(/At Level 1/);
      el.find('ul ul li').eq(0).find('a').click();
      expect(doc.all('children').at(0)).toBe(text);
      expect(doc.all('children').at(2)).toBe(newSection);
      expect(root.transitionTo).toHaveBeenCalledWith('write');
    });
  });

});
