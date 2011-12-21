s.views.Invite = Backbone.View.extend({

  className: 'shelf-content',

  initialize: function () {
    _.bindAll(this);
    this.collaborators = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_invite', {
      collaborators: this.collaborators,
      document: this.model
    }));
    this.trigger('resize');
    return this;
  },

  load: function (callback) {
    if (this.collaborators) {
      callback(null);
    } else {
      getCollaborators(this.model, _.bind(function (err, nodes) {
        if (!err) {
          this.collaborators = nodes;
        }
        callback(err);
      }, this));
    }
  },


  // Events
  // ------

  events: {
    'submit form': 'invite',
    'change .change-mode': 'changeMode',
    'click .remove-collaborator': 'removeCollaborator'
  },

  changeMode: function (e) {
    var collaboratorId = $(e.currentTarget).attr('data-collaborator')
    ,   mode           = $(e.currentTarget).val();
    
    changeCollaboratorMode(collaboratorId, mode, _.bind(function (err) {
      this.render();
    }, this));
    
    return false;
  },

  removeCollaborator: function (e) {
    var collaboratorId = $(e.currentTarget).attr('data-collaborator');
    
    removeCollaborator(collaboratorId, _.bind(function (err) {
      this.collaborators.del(collaboratorId);
      this.render();
    }, this));
    
    return false;
  },

  invite: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var email = this.$('#collaborator_email').val()
    ,   mode  = this.$('#collaborator_mode').val();
    
    invite(email, this.model, mode, _.bind(function (err) {
      this.collaborators = null;
      this.load(this.render);
    }, this));
  }

});
