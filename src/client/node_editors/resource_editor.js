var ResourceEditor = Backbone.View.extend({
  events: {
    'keydown .resource-url': 'update'
  },
  
  resourceExists: function(url, callback) {
    var img = new Image();
    img.onload = function() { callback(null); }
    img.onerror = function() { callback('not found'); }
    img.src = url;
  },
  
  update: function() {
    var that = this;
    
    function perform() {
      var url = that.$('.resource-url').val();
      that.resourceExists(url, function(err) {
        if (!err) {
          that.$('.resource-content img').attr('src', url);
          that.$('.status').replaceWith('<div class="status image">Image</div>');
          app.document.updateSelectedNode({
            url: url
          });
        } else {
          that.$('.status').replaceWith('<div class="status">Invalid URL</div>');
        }
      });      
    }
    
    setTimeout(perform, 500);
  },
  
  initialize: function() {
    var that = this;
    
    this.pendingCheck = false;
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
  },
  
  render: function() {
    
  }
});