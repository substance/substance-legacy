// Invite
// -------------

DocumentViews["invite"] = Backbone.View.extend({
  events: {
    'submit form': 'invite',
    'change select.change-mode': 'changeMode',
    'click a.remove-collaborator': 'removeCollaborator'
  },
  
  changeMode: function(e) {
    var collaboratorId = $(e.currentTarget).attr('collaborator');
    var mode = $(e.currentTarget).val();
    var that = this;
    
    window.pendingSync = true;
    
    graph.get(collaboratorId).set({
      mode: mode
    });
    
    // trigger immediate sync
    graph.sync(function(err) {
      window.pendingSync = false;
      that.render();
    });
    
    return false;
  },
  
  removeCollaborator: function(e) {
    var collaboratorId = $(e.currentTarget).attr('collaborator');
    var that = this;
    
    window.pendingSync = true;
    graph.del(collaboratorId);
    
    // trigger immediate sync
    graph.sync(function(err) {
      window.pendingSync = false;
      that.collaborators.del(collaboratorId);
      that.render();
    });

    return false;
  },
  
  invite: function() {
    var that = this;
    $.ajax({
      type: "POST",
      url: "/invite",
      data: {
        email: $('#collaborator_email').val(),
        document: app.document.model._id,
        mode: $('#collaborator_mode').val()
      },
      dataType: "json",
      success: function(res) {
        if (res.error) return alert(res.error);
        that.load();
      },
      error: function(err) {
        alert("Unknown error occurred");
      }
    });
    return false;
  },
  
  load: function(callback) {
    var that = this;
    graph.fetch({"type": "/type/collaborator", "document": app.document.model._id}, function(err, nodes) {
      that.collaborators = nodes;
      that.loaded = true;
      that.render(callback);
    });
  },
  
  initialize: function(options) {
    this.document = options.document;
    this.el = '#document_shelf';
  },
  
  render: function(callback) {
    if (!this.loaded) return this.load(callback);
    $(this.el).html(_.tpl('document_invite', {
      collaborators: this.collaborators,
      document: this.document.model
    }));
    this.delegateEvents();
    callback();
  }
});
