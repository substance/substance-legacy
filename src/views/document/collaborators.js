sc.views.Collaborators = Backbone.View.extend({

  // Events
  // ------

  events: {
    'submit #add_collaborator_form': 'addCollaborator',
    'click .remove-collaborator': 'removeCollaborator'
  },

  // Handlers
  // --------

  addCollaborator: function(e) {
    var collaborator = this.$('#collaborator').val();
    var that = this;

    session.createCollaborator(collaborator, function(err) {
      that.render();
    });
    return false;
  },

  removeCollaborator: function(e) {
    var id = $(e.currentTarget).attr('data-id');
    var that = this;
    
    session.deleteCollaborator(id, function(err) {
      that.render();
    });
    return false;
  },

  initialize: function() {
    
  },

  render: function () {
    if (this.model.collaborators) {
      this.$el.html(_.tpl('document_collaborators', this.model)); 
    } else {
      this.$el.html('loading...');
    }
    return this;
  }
});