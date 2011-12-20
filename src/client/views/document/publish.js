// Publish
// -------------

s.views.Publish = Backbone.View.extend({
  events: {
    'click a.publish-document': 'publishDocument',
    'click .remove-version': 'removeVersion'
  },

  publishDocument: function(e) {
    publishDocument({
      document: this.model.document._id,
      networks: this.$('.networks-selection').val() || [],
      remark: $('#version_remark').val()
    }, function (err, res) {
      console.log('yay');
    });
    return false;
  },
  
  removeVersion: function(e) {
    removeVersion(document, $(e.currentTarget).attr('version'), function() {
      console.log('JO');
    });
  },
  
  render: function() {
    $(this.el).html(s.util.tpl('document_publish', this.model));
  }
});
