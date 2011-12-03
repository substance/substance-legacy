describe("Resource", function () {
  var doc, node, view, url, caption;

  beforeEach(function () {
    doc = createTestDocument();
    node = createNode('/type/resource', new Position(doc, null));
    url = 'http://michael.jpg.to/';
    caption = "That's Michael ;)";
    node.set({
      url: url,
      caption: caption
    });
    spyOn(_, 'throttle').andCallFake(_.identity);
    view = Node.create({
      model: node,
      parent: doc
    }).render();
    $(view.el).appendTo(document.body);
  });

  afterEach(function () {
    delete window.graph;
    $(view.el).remove();
  });

  describe("render", function () {
    it("should display the image and the caption", function () {
      var el = $(view.el);
      expect(el.find('img').attr('src')).toBe(url);
      expect(el.find('.resource-url').val()).toBe(url);
      expect(el.find('.caption').text()).toBe(caption);
    });
  });

  describe("focus", function () {
    it("should focus the node", function () {
      view.transitionTo('write');
      view.focus();
      expect($(view.el).find('.caption').is(':focus')).toBe(true);
    });
  });

  it("should be editable", function () {
    testIsEditable(view, '.caption');
  });

  describe("resourceExists", function () {
    it("should call the callback with true if the resource exists", function () {
      var callback = jasmine.createSpy();
      runs(function () {
        view.resourceExists('http://tim.jpg.to/', callback);
      });
      waitsForSpy(callback);
      runs(function () {
        expect(callback).toHaveBeenCalledWith(true);
      });
    });

    it("should call the callback with false if the resource is non-existant", function () {
      var callback = jasmine.createSpy();
      runs(function () {
        view.resourceExists('http://asdfasdf.dkdkawsadlls.de/', callback);
      });
      waitsForSpy(callback);
      runs(function () {
        expect(callback).toHaveBeenCalledWith(false);
      });
    });
  });

  it("should update the image and status when the user enters a new valid url", function () {
    view.transitionTo('write');
    spyOn(view, 'resourceExists').andCallFake(function (url, cb) { cb(true); });
    var newUrl = 'http://space.jpg.to/';
    expect(view.$('.status').text()).toMatch(/Enter URL/);
    view.$('.resource-url').val(newUrl).keyup();
    expect(node.get('url')).toBe(newUrl);
    expect(view.$('.status').text()).toMatch(/Image/);
  });

  it("should display an error when the user enters a new invalid url", function () {
    view.transitionTo('write');
    spyOn(view, 'resourceExists').andCallFake(function (url, cb) { cb(false); });
    var newUrl = 'http://asdfasdkd.skdkd.com/';
    view.$('.resource-url').val(newUrl).keyup();
    expect(node.get('url')).toBe(url);
    expect(view.$('.status').text()).toMatch(/Invalid/);
  });

  describe("State", function () {
    it("should be editable only in 'write' state", function () {
      var input = view.$('.resource-url');
      expect(input.attr('readonly')).toBe('readonly');
      view.transitionTo('write');
      expect(input.attr('readonly')).toBeUndefined();
      view.transitionTo('read');
      expect(input.attr('readonly')).toBe('readonly');
    });
  });
});
