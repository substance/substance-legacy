var PublishSettings = Backbone.View.extend({
  events: {
    'click a.publish-document': 'publishDocument',
    'click .remove-version': 'removeVersion',
    'focus #version_remark': 'focusRemark',
    'blur #version_remark': 'blurRemark'
  },
  
  focusRemark: function(e) {
    var input = $('#version_remark');
        
    if (input.val() === 'Enter optional remark.') {
      input.val('');
    }
  },
  
  blurRemark: function(e) {
    var input = $('#version_remark');
        
    if (input.val() === '') {
      input.val('Enter optional remark.');
    }
  },
  
  publishDocument: function(e) {
    var that = this;
    var remark = $('#version_remark').val();
    
    console.log(this.$('#version_remark'));
    $.ajax({
      type: "POST",
      url: "/publish",
      data: {
        document: app.document.model._id,
        remark: remark === 'Enter optional remark.' ? '' : remark
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return alert(res.error);
        that.load();
      },
      error: function(err) {
        console.log(err);
        alert("Unknown error occurred");
      }
    });
    
    return false;
  },
  
  removeVersion: function(e) {
    var version = $(e.currentTarget).attr('version');
    var that = this;
    
    window.pendingSync = true;
    graph.del(version);
    
    // Trigger immediate sync
    graph.sync(function (err) {
      window.pendingSync = false;
      that.load();
    });
    
    return false;
  },
  
  load: function() {
    var that = this;
    // Load versions
    graph.fetch({"type": "/type/version", "document": app.document.model._id}, function(err, versions) {
      that.versions = versions;
      that.render();
    });
  },
  
  initialize: function() {
    this.el = '#publish_settings';
  },
  
  render: function() {
    $(this.el).html(_.tpl('publish_settings', {
      versions: this.versions,
      document: app.document.model
    }));
    this.delegateEvents();
  }
});
