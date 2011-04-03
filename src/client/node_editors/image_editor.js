var ImageEditor = Backbone.View.extend({
  events: {
    'change .image-file ': 'upload'
  },
  
  upload: function() {
    this.$('.upload-image-form').submit();
  },
  
  initialize: function() {
    var that = this;
    
    this.$caption = this.$('.caption');
    
    editor.activate(this.$caption, {
      placeholder: 'Enter Caption',
      multiline: false,
      markup: false
    });
    
    editor.bind('changed', function() {
      app.document.updateSelectedNode({
        caption: editor.content()
      });
    });
    
    this.$('.upload-image-form').transloadit({
      modal: false,
      wait: true,
      autoSubmit: false,
      onProgress: function(bytesReceived, bytesExpected) {
        var percentage = parseInt(bytesReceived / bytesExpected * 100);
        if (!(percentage >= 0)) percentage = 0;
        that.$('.image-progress .label').html('Uploading ... '+ percentage+'%');
        that.$('.progress-bar').attr('style', 'width:' + percentage +'%');
      },
      onError: function(assembly) {
        that.$('.image-progress .label').html('Invalid image. Skipping ...');
        that.$('.progress-container').hide();

        setTimeout(function() {
          app.document.reset();
          that.$('.info').show();
        }, 3000);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
      },
      onStart: function() {
        that.$('.image-progress').show();
        that.$('.info').hide();
        that.$('.image-progress .label').html('Uploading ...');
        that.$('.progress-bar').attr('style', 'width: 0%');
      },
      onSuccess: function(assembly) {
        // This triggers a node re-render
        if (assembly.results.resize_image && assembly.results.resize_image[0] && assembly.results.resize_image[0].url) {
          app.document.updateSelectedNode({
            url: assembly.results.resize_image[0].url,
            dirty: true
          });
          app.document.reset();
          that.$('.progress-container').hide();
          that.$('.info').show();
        } else {
          that.$('.image-progress .label').html('Invalid image. Skipping ...');
          that.$('.progress-container').hide();

          setTimeout(function() {
            app.document.reset();
            that.$('.info').show();
          }, 3000);
        }
      }
    });
  },
  
  render: function() {
    // this.$('.node-editor-placeholder').html(Helpers.renderTemplate('edit_image', app.document.selectedNode.data));
  }
});