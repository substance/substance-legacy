Node.define('/type/resource', {

  className: 'content-node resource',

  initialize: function () {
    Node.prototype.initialize.apply(this, arguments);
    this.updateUrl = _.throttle(this.updateUrl, 500);
  },

  resourceExists: function (url, callback) {
    var img = new Image();
    img.onload  = function () { callback(true); }
    img.onerror = function () { callback(false); }
    img.src = url;
  },

  updateUrl: function (url) {
    this.resourceExists(url, _.bind(function (doesIt) {
      if (doesIt) {
        this.img.attr({ src: url });
        this.status.addClass('image').text("Image");
        
        var update = {};
        update[attr] = val;
        updateNode(node, update);
      } else {
        this.status.prop({ className: 'status' }).text("Invalid URL");
      }
    }, this));
  },

  render: function () {
    Node.prototype.render.apply(this);
    
    this.resourceContent = $('<div class="resource-content" />').appendTo(this.contentEl);
    if (!this.model.get('url')) { this.resourceContent.addClass('placeholder'); }
    
    this.img = $('<img />')
      .attr({ src: this.model.get('url') || '/images/image_placeholder.png' })
      .appendTo(this.resourceContent);
    
    var resourceEditor = $(
      '<div class="resource-editor">' +
        '<div class="resource-url-area">' +
          '<div class="url-label">Resource URL (Images are supported yet)</div>' +
          '<div class="url-container">' +
            '<input class="resource-url" type="text" name="url" value="" />' +
            '<div class="status">Enter URL</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    ).appendTo(this.contentEl);
    
    this.status = resourceEditor.find('.status');
    
    this.resourceUrl = resourceEditor.find('.resource-url')
      .val(this.model.get('url'))
      .click(_.bind(function (e) {
        if (this.state !== 'write') {
          e.preventDefault();
          e.stopPropagation();
        }
      }, this))
      .keyup(_.bind(function () {
        this.updateUrl($(this.resourceUrl).val());
      }, this));
    
    this.caption = this.makeEditable($('<div class="caption content" />'), 'caption', "Enter Caption")
      .appendTo(this.contentEl);
    
    return this;
  }

});
