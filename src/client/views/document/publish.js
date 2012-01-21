s.views.Publish = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_publish',

  initialize: function (options) {
    _.bindAll(this);
    this.docView = options.docView;
    this.data = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_publish', {
      availableNetworks: this.data.availableNetworks,
      networks: this.data.networks,
      versions: this.data.versions,
      document: this.model
    }));

    this.trigger('resize');
    this.$("select.networks-selection").chosen();
    return this;
  },

  load: function (callback) {
    if (this.data) {
      callback(null);
    } else {
      loadPublish(this.model, _.bind(function (err, res) {
        if (!err) { this.data = res; }
        callback(err);
      }, this));
    }
  },


  // Events
  // ------

  events: {
    'click .publish-document': 'publishDocument',
    'click .unpublish-document': 'unpublishDocument'
  },

  publishDocument: function (e) {
    var networks = this.$('.networks-selection').val() || []
    ,   remark   = this.$('#version_remark').val();
    publishDocument(this.model, networks, remark, _.bind(function (err, res) {
      this.data = null;
      this.load(this.render);
      this.docView.updatePublishState();
    }, this));
    return false;
  },

  unpublishDocument: function(e) {
    unpublishDocument(this.model, _.bind(function(err, res) {
      this.data = null;
      this.load(this.render);
      this.docView.updatePublishState();
    }, this));
    return false;
  }

});
