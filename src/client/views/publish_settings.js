var PublishSettings = Backbone.View.extend({
  events: {
    // 'submit form': 'invite',
    // 'change select.change-mode': 'changeMode',
    // 'click a.remove-collaborator': 'removeCollaborator'
  },
  
  // changeMode: function(e) {
  //   var collaboratorId = $(e.currentTarget).attr('collaborator');
  //   var mode = $(e.currentTarget).val();
  //   
  //   graph.get(collaboratorId).set({
  //     mode: mode
  //   });
  //   // trigger immediate sync
  //   graph.sync();
  //   
  //   return false;
  // },
  // 
  // removeCollaborator: function(e) {
  //   var collaboratorId = $(e.currentTarget).attr('collaborator');
  //   graph.del(collaboratorId);
  //   // trigger immediate sync
  //   graph.sync();
  //   this.collaborators.del(collaboratorId);
  //   this.render();
  //   return false;
  // },
  
  // invite: function() {
  //   var that = this;
  //   $.ajax({
  //     type: "POST",
  //     url: "/invite",
  //     data: {
  //       email: $('#collaborator_email').val(),
  //       document: app.document.model._id,
  //       mode: $('#collaborator_mode').val()
  //     },
  //     dataType: "json",
  //     success: function(res) {
  //       if (res.error) return alert(res.error);
  //       that.load();
  //     },
  //     error: function(err) {
  //       alert("Unknown error occurred");
  //     }
  //   });
  //   
  //   return false;
  // },
  
  load: function() {

    var that = this;
    // Load versions
    graph.fetch({"type": "/type/version", "document": app.document.model._id}, function(err, versions) {
      console.log(versions);
      that.versions = versions;
      that.render();
    });
  },
  
  initialize: function() {
    this.el = '#publish_settings';
  },
  
  render: function() {
    $(this.el).html(_.tpl('publish_settings', {
      // collaborators: this.collaborators,
      versions: this.versions,
      // document: app.document.model
    }));
    this.delegateEvents();
  }
});
