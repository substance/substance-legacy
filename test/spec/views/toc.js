describe("TOC (Table of Contents)", function () {
  var doc, first, firstfirst, second, toc;

  beforeEach(function () {
    window.graph = new Data.Graph(seed);
    
    doc = graph.set(null, _.extend(graph.get('/type/article').meta.template, {
      name: 'testing-doc',
      title: "Testing Doc"
    }));
    
    first = graph.set(null, {
      type: '/type/section',
      name: "First",
      document: doc._id
    });
    first.html_id = 'a';
    doc.all('children').set(first._id, first, 0);
    
    firstfirst = graph.set(null, {
      type: '/type/section',
      name: "First subsection of the first section",
      document: doc._id
    });
    firstfirst.html_id = 'aa';
    first.all('children').set(firstfirst._id, firstfirst, 0);
    
    second = graph.set(null, {
      type: '/type/section',
      name: "Second",
      document: doc._id
    });
    second.html_id = 'b';
    doc.all('children').set(second._id, second, 1);
    
    toc = new s.views.TOC({ model: doc }).render();
  });

  afterEach(function () {
    delete window.graph;
  });

  describe("content", function () {
    it("should contain the names of all sections in a hierarchical manner", function () {
      var el = $(toc.el);
      expect(el.find('li').length).toBe(3);
      expect(el.find('li a').eq(0).text()).toBe("First");
      expect(el.find('li li').length).toBe(1);
      expect(el.find('li li').text()).toBe("First subsection of the first section");
      expect(el.find('li a').eq(2).text()).toBe("Second");
    });
  });

  describe("Clicking on section names", function () {
    it("should take me to that section", function () {
      window.app = {
        toggleTOC: jasmine.createSpy(),
        scrollTo: jasmine.createSpy()
      };
      var el = $(toc.el);
      el.find('li li a').click();
      expect(app.scrollTo).toHaveBeenCalledWith('aa');
      expect(app.toggleTOC).toHaveBeenCalled();
      delete window.app;
    });
  });
});
