s.views.DocumentSettings = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_settings',

  initialize: function () {},

  render: function () {
    $(this.el).html(s.util.tpl('document_settings', {
      doc: this.model
    }));
    this.trigger('resize');
    return this;
  },

  load: function (callback) { callback(null); },


  // Events
  // ------

  events: {
    'click .delete': 'deleteDocument',
    'keyup #new_name': 'changeName',
    'submit .rename': 'rename'
  },

  deleteDocument: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocument(this.model, function (err) {
        router.navigate('', true); // TODO
      });
    }
  },

  changeName: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.$('.rename input[type=submit]').attr({ disabled: false });
  },

  rename: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var name = this.$('#new_name').val();
    this.$('.error').text("");
    updateDocumentName(this.model, name, _.bind(function (err) {
      if (err) {
        this.$('.error').text(err.message);
      } else {
        this.$('.rename input[type=submit]').attr({ disabled: true });
        router.navigate(documentURL(this.model), false);
      }
    }, this));
  }

});
