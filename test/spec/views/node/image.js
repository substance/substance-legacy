describe("Image", function () {
  var doc, node, view, caption, url, submitSpy, transloaditOptions;

  beforeEach(function () {
    doc = createTestDocument();
    node = createNode('/type/image', new Position(doc, null));
    caption = "Lorem ipsum rendered";
    url = 'http://lorem.jpg.to/';
    
    submitSpy = jasmine.createSpy();
    $.fn.transloadit = function (o) {
      $(this).submit(function (e) {
        submitSpy();
        return false;
      });
      transloaditOptions = o;
    };
    
    node.set({
      caption: caption,
      url: url,
      original_url: url
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
    it("should display the image and the caption", function () {
      var el = $(view.el);
      expect(el.find('img').attr('src')).toBe(url);
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

  describe("State", function () {
    it("should make the image clickable in read state", function () {
      var el = $(view.el);
      expect(el.find('a img').length).toBe(1);
      expect(el.find('a img').parent().attr('href')).toBe(url);
      view.transitionTo('write');
      expect(el.find('a img').length).toBe(0);
      view.transitionTo('read');
      expect(el.find('a img').length).toBe(1);
      expect(el.find('a img').parent().attr('href')).toBe(url);
    });
  });

  describe("Uploading", function () {
    it("should display the progress", function () {
      var el = $(view.el);
      view.upload();
      expect(submitSpy).toHaveBeenCalled();
      
      transloaditOptions.onStart();
      expect(el.find('.image-progress').css('display')).toBe('block');
      expect(el.find('.info').css('display')).toBe('none');
      expect(el.find('.image-progress .label').text()).toMatch(/Uploading/);
      expect(el.find('.progress-bar').css('width')).toMatch(/^0/);
      
      transloaditOptions.onProgress(3e3, 10e3);
      expect(el.find('.image-progress .label').text()).toMatch(/30%/);
      expect(parseInt(el.find('.progress-bar').css('width'), 10)).toBeGreaterThan(0);
      
      var newUrl = 'ipsum.jpg.to';
      transloaditOptions.onSuccess({
        results: {
          web_version: [
            null,
            { url: newUrl }
          ],
          print_version: [
            null,
            { url: newUrl }
          ]
        }
      });
      expect(node.get('url')).toBe(newUrl);
      expect(node.get('original_url')).toBe(newUrl);
      expect(el.find('.progress-container').css('display')).toBe('none');
      expect(el.find('.info').css('display')).toBe('block');
      
      el.find('.info').css({ display: 'none' });
      spyOn(window, 'setTimeout').andCallFake(function (callback) {
        expect(el.find('.image-progress .label').text()).toMatch(/Invalid image/);
        expect(el.find('.progress-container').css('display')).toBe('none');
        callback();
      });
      transloaditOptions.onSuccess({ results: {} });
      expect(el.find('.info').css('display')).toBe('block');
    });
  });
});
