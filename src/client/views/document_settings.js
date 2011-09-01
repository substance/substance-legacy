var DocumentSettings = Backbone.View.extend({
  events: {
    'submit form': 'invite'
  },

  invite: function() {
    var that = this;
    $.ajax({
      type: "POST",
      url: "/invite",
      data: {
        email: $('#collaborator_email').val(),
        document: app.document.model._id
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
  
  load: function() {
    var that = this;
    graph.fetch({"type": "/type/collaborator", "document": app.document.model._id}, function(err, nodes) {
      that.collaborators = nodes;
      that.render();
    });
  },
  
  initialize: function() {
    this.el = '#document_settings';
  },
  
  render: function() {
    $(this.el).html(_.tpl('document_settings', {
      collaborators: this.collaborators,
      document: app.document.model
    }));
    this.delegateEvents();
  }
});
