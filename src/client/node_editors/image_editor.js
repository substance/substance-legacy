var ImageEditor = Backbone.View.extend({
  events: {
    
  },
  
  initialize: function() {
    var that = this;
    this.render();
    
    $('#upload_image').transloadit({
      modal: false,
      wait: true,
      autoSubmit: false,
      onProgress: function(bytesReceived, bytesExpected) {
        percentage = (bytesReceived / bytesExpected * 100).toFixed(2) || 0;
        $('#upload_progress').attr('style', 'width:' + percentage +'%');
        $('#image_progress_legend').html('<strong>Uploading:</strong> ' + percentage + '% complete</div>');
      },
      onError: function(assembly) {
        alert(assembly.error+': '+assembly.message);
        $('#progress_container').hide();
      },
      onStart: function() {
        $('#progress_container').show();
      },
      onSuccess: function(assembly) {
        // This triggers a node re-render
        app.document.updateSelectedNode({
          url: assembly.results.resize_image[0].url,
          dirty: true
        });
        $('#progress_container').hide();
      }
    });
  },
  
  render: function() {
    this.$('.node-editor-placeholder').html(Helpers.renderTemplate('edit_image', app.editor.model.selectedNode.data));
  }
});