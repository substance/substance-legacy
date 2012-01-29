describe("Comments", function () {

  var doc, code, comments, commentsHash, first, second, version1, version2;

  beforeEach(function () {
    window.graph = new Data.Graph(seed);
    
    doc = graph.set(null, _.extend(graph.get('/type/article').meta.template, {
      name: 'importance-of-comments',
      title: "Why comments are important"
    }));
    
    version1 = graph.set('/version/abcde/1', {
      type: '/type/version',
      remark: "Initial publication",
      data: null,
      document: doc._id
    });
    
    version2 = graph.set('/version/abcde/2', {
      type: '/type/version',
      remark: "Fixed a typo",
      data: null,
      document: doc._id
    });
    
    code = graph.set(null, {
      type: '/type/code',
      language: 'haskell',
      content: 'sum . takeWhile (<100) . map (^2) $ [1..]',
      document: doc._id
    });
    code.html_id = 'asdfasdff';
    
    comments = new s.views.Comments({
      node: { root: { document: { version: version2._id } } },
      model: code
    });
    
    window.app = {
      username: 'michael'
    };
    
    graph.set('/user/michael', {
      type: '/type/user',
      username: 'michael',
      name: "Michael Aufreiter"
    });
    graph.set('/user/timbaumann', {
      type: '/type/user',
      username: 'timbaumann',
      name: "Tim Baumann"
    });
    
    commentsHash = new Data.Hash();
    first = graph.set(null, {
      type: '/type/comment',
      content: "Good point.",
      node: code._id,
      document: doc._id,
      version: version1._id,
      creator: "/user/michael",
      created_at: new Date(2011, 11, 30)
    });
    commentsHash.set(first._id, first, 0);
    second = graph.set(null, {
      type: '/type/comment',
      content: "While your analysis is mostly correct, I see ...",
      node: code,
      document: doc._id,
      version: version2._id,
      creator: "/user/timbaumann",
      created_at: new Date(2011, 12, 1)
    });
    commentsHash.set(second._id, second, 1);
    
    spyOn(window, 'loadComments').andCallFake(function (node, callback) {
      expect(node).toBe(code);
      callback(null, commentsHash);
    });
    
    $(comments.el).appendTo(document.body);
    comments.render();
  });

  afterEach(function () {
    comments.remove();
    delete window.graph;
    delete window.app;
  });

  describe("expansion and contraction", function () {
    it("should be contracted by default", function () {
      expect(comments.expanded).toBe(false);
      expect($(comments.el).hasClass('expanded')).toBe(false);
    });

    it("should load all comments on first expansion", function () {
      comments.expand();
      expect(comments.expanded).toBe(true);
      expect($(comments.el).hasClass('expanded')).toBe(true);
      expect(loadComments).toHaveBeenCalled();
      comments.contract();
      expect(comments.expanded).toBe(false);
      expect($(comments.el).hasClass('expanded')).toBe(false);
      comments.expand();
      expect(loadComments.callCount).toBe(1);
    });

    it("should toggle between the contracted and expanded states", function () {
      comments.toggle();
      expect(comments.expanded).toBe(true);
      comments.toggle();
      expect(comments.expanded).toBe(false);
    });
  });

  describe("load", function () {
    it("should use loadComments, save them and render the view", function () {
      var callback = jasmine.createSpy();
      spyOn(comments, 'render');
      comments.load(callback);
      expect(comments.render).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("scrollTo", function () {
    it("should scroll to the comments element", function () {
      comments.expand();
      spyOn($.fn, 'animate').andCallFake(function (properties) {
        expect(typeof properties.scrollTop).toBe('number');
        expect(properties.scrollTop).toBeLessThan($(comments.el).offset().top);
      });
      comments.remove();
    });
  });

  describe("render", function () {
    it("should have no content initially", function () {
      expect($(comments.el).html()).toBe('');
    });
    it("should display all comments", function () {
      comments.expand();
      var el = $(comments.el);
      expect(el.find('#comments' + code.html_id).text()).toBe("Comments");
      expect(el.find('.comment').length).toBe(2);
      var firstComment = el.find('.comment').eq(0);
      expect(firstComment.text()).toMatch(/michael/);
      expect(firstComment.text()).toMatch(/Good point/);
      expect(firstComment.text()).toMatch(/Remove/);
      expect(firstComment.text()).toMatch(/different version/);
      var secondComment = el.find('.comment').eq(1);
      expect(secondComment.text()).toMatch(/timbaumann/);
      expect(secondComment.text()).toMatch(/While/);
      expect(secondComment.text()).not.toMatch(/Remove/);
      expect(secondComment.text()).not.toMatch(/different version/);
    });
  });

  describe("Adding comments", function () {
    it("", function () {
      comments.expand();
      var el = $(comments.el);
      spyOn(window, 'createComment').andCallFake(function (node, content, callback) {
        expect(node).toBe(code);
        expect(content).toBe("<p>I agree.</p>");
        var third = graph.set(null, {
          type: '/type/comment',
          content: content,
          node: code._id,
          document: doc._id,
          version: version2._id,
          creator: "/user/michael",
          created_at: new Date(2011, 12, 2)
        });
        commentsHash.set(third._id, third, 0);
        callback();
      });
      expect(comments.commentEditor).toBeUndefined();
      el.find('.comment-content').click().html("<p>I agree.</p>");
      expect(typeof comments.commentEditor).toBe('object');
      el.find('.create-comment').click();
      expect(el.find('.comment').length).toBe(3);
    });
  });

  describe("Removing comments", function () {
    it("should call removeComment", function () {
      spyOn(window, 'removeComment').andCallFake(function (comment, callback) {
        expect(comment).toBe(first);
        commentsHash.del(first._id);
        callback();
      });
      comments.expand();
      $(comments.el).find('.remove-comment').eq(0).click();
      expect(removeComment).toHaveBeenCalled();
      expect($(comments.el).find('.comment').length).toBe(1);
    });
  });
});
