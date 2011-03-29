var ImageEditor = Backbone.View.extend({
  events: {
    'change .image-file ': 'upload'
  },
  
  upload: function() {
    console.log(this.$('.upload-image-form'));
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
        that.$('.image-progress').show();
        if (!(percentage >= 0)) percentage = 0;
        
        console.log('upload complete: '+percentage);
        that.$('.progress-bar').attr('style', 'width:' + percentage +'%');
        // $('#image_progress_legend').html('<strong>Uploading:</strong> ' + percentage + '% complete</div>');
      },
      onError: function(assembly) {
        console.log(assembly.error+': '+assembly.message);
        alert(assembly.error+': '+assembly.message);
        that.$('.progress-container').hide();
      },
      // onStart: function() {
      //   that.$('.image-progress').show();
      // },
      onSuccess: function(assembly) {
        // This triggers a node re-render
        if (assembly.results.resize_image && assembly.results.resize_image[0] && assembly.results.resize_image[0].url) {
          app.document.updateSelectedNode({
            url: assembly.results.resize_image[0].url,
            dirty: true
          });
          app.document.reset();
          that.$('.progress-container').hide();
        }
        
      }
    });
  },
  
  render: function() {
    // this.$('.node-editor-placeholder').html(Helpers.renderTemplate('edit_image', app.document.selectedNode.data));
  }
});