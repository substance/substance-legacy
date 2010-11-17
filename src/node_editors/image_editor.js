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
        percentage = (bytesReceived / bytesExpected * 100).toFixed(2)
        $('#upload_progress').attr('style', 'width:' + percentage +'%');
        $('#image_progress_legend').html('<strong>Uploading:</strong> ' + percentage + '% complete</div>');
      },
      onError: function(assembly) {
        alert(assembly.error+': '+assembly.message);
      },
      onStart: function() {
        $('#progress_container').show();
      },
      onSuccess: function(assembly) {
        try {
          // This triggers a node re-render
          that.model.updateSelectedNode({
            url: assembly.results.resize_image[0].url
          });
          $('#progress_container').hide();
        } catch (err) {
          throw err;
        }
      }
    });
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('edit_image', this.model.selectedNode.data));
  }
});