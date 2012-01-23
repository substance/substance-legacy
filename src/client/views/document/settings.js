s.views.DocumentSettings = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_settings',

  initialize: function () {},

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
    this.$('.image-progress .label').html("Uploading &hellip;");
    this.$('.progress-bar').css('width', '0%');
  },

  onProgress: function (bytesReceived, bytesExpected) {
    var percentage = Math.max(0, parseInt(bytesReceived / bytesExpected * 100));
    this.$('.image-progress .label').html("Uploading &hellip; " + percentage + "%");
    this.$('.progress-bar').css('width', percentage + '%');
  },

  onSuccess: function (assembly) {
    this.model.set({
      cover: assembly.results.web_version[1].url
    });
    
    this.$('.image-progress').hide();
    $('.upload-image-form img').attr('src', assembly.results.web_version[1].url);
  },

  onError: function (assembly) {
    // TODO
  },

  onInvalid: function () {
    this.$('.image-progress .label').html("Invalid image. Skipping &hellip;");
    this.$('.image-progress').hide();
    
    setTimeout(_.bind(function () {
      this.$('.info').show();
    }, this), 3000);
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_settings', {
      doc: this.model,
      transloadit_params: config.transloadit.document_cover
    }));

    this.initializeUploadForm();
    this.trigger('resize');
    return this;
  },

  load: function (callback) { callback(null); },


  // Events
  // ------

  events: {
    'click .delete': 'deleteDocument',
    'keyup #new_name': 'changeName',
    'submit .rename': 'rename',
    'change .image-file': 'upload'
  },

  upload: function() {
    this.$('.upload-image-form').submit();
  },

  deleteDocument: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocument(this.model, function (err) {
        router.navigate('', true); // TODO
      });
    }
  },

  changeName: function (e) {
    e.preventDefault();
    e.stopPropagation();
  },

  rename: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var name = this.$('#new_name').val();
    this.$('.error').text("");
    updateDocumentName(this.model, name, _.bind(function (err) {
      if (err) {
        this.$('.error').text(err.message);
      } else {
        router.navigate(documentURL(this.model), false);
      }
    }, this));
  }

});
