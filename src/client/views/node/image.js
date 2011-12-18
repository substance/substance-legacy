s.views.Node.define('/type/image', {

  className: 'content-node image',

  events: _.extend({
    'change .image-file': 'upload'
  }, s.views.Node.prototype.events),

  focus: function () {
    this.caption.click();
  },

  initializeUploadForm: function () {
    _.bindAll(this, 'onStart', 'onProgress', 'onError');
    
    this.$('.upload-image-form').transloadit({
      modal: false,
      wait: true,
      autoSubmit: false,
      onStart: this.onStart,
      onProgress: this.onProgress,
      onError: this.onError,
      onSuccess: _.bind(function (assembly) {
        if (assembly.results.web_version &&
            assembly.results.web_version[1] &&
            assembly.results.web_version[1].url) {
          this.onSuccess(assembly);
        } else {
          this.onInvalid();
        }
      }, this)
    });
  },

  onStart: function () {
    this.$('.image-progress').show();
    this.$('.info').hide();
    this.$('.image-progress .label').html("Uploading &hellip;");
    this.$('.progress-bar').css('width', '0%');
  },

  onProgress: function (bytesReceived, bytesExpected) {
    var percentage = Math.max(0, parseInt(bytesReceived / bytesExpected * 100));
    this.$('.image-progress .label').html("Uploading &hellip; " + percentage + "%");
    this.$('.progress-bar').css('width', percentage + '%');
  },

  onSuccess: function (assembly) {
    // This triggers a node re-render
    updateNode(this.model, {
      url: assembly.results.web_version[1].url,
      original_url: assembly.results.print_version[1].url,
      dirty: true
    });
    
    this.$('.progress-container').hide();
    this.$('.info').show();
  },

  onError: function (assembly) {
    // TODO
    //alert(JSON.stringify(assembly));
    //this.$('.image-progress .label').html("Invalid image. Skipping &hellip;");
    //this.$('.progress-container').hide();
    //
    //setTimeout(_.bind(function () {
    //  app.document.reset();
    //  this.$('.info').show();
    //}, this), 3000);
  },

  onInvalid: function () {
    this.$('.image-progress .label').html("Invalid image. Skipping &hellip;");
    this.$('.progress-container').hide();
    
    setTimeout(_.bind(function () {
      this.$('.info').show();
    }, this), 3000);
  },

  upload: function () {
    this.$('.upload-image-form').submit();
  },

  render: function () {
    s.views.Node.prototype.render.apply(this);
    
    this.imageContent = $('<div class="image-content" />').appendTo(this.contentEl);
    if (!this.model.get('url')) { this.imageContent.addClass('placeholder'); }
    
    this.img = $('<img />')
      .attr({ src: this.model.get('url') || '/images/image_placeholder.png' });
    
    $('<a target="_blank" />')
      .attr({ href: this.model.get('original_url') })
      .append(this.img)
      .appendTo(this.imageContent);
    
    this.imageEditor = $(s.util.tpl('image_editor', {
      transloadit_params: config.transloadit
    })).appendTo(this.imageContent);
    this.initializeUploadForm();
    
    this.caption = this.makeEditable($('<div class="caption" />'), 'caption', "Enter Caption")
      .insertAfter(this.contentEl);
    
    return this;
  }

}, {

  states: {
    write: {
      enter: function () {
        s.views.Node.states.write.enter.apply(this);
        
        this.img.unwrap();
      },
      leave: function () {
        s.views.Node.states.write.leave.apply(this);
        
        this.img.wrap($('<a target="_blank" />')
          .attr({ href: this.model.get('original_url') }));
      }
    },
  }

});
