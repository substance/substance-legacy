s.views.Publish = Backbone.View.extend({

  className: 'shelf-content',

  initialize: function () {
    _.bindAll(this);
    this.networks = null;
    this.versions = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_publish', {
      networks: this.networks,
      versions: this.versions,
      document: this.model
    }));
    this.trigger('resize');
    return this;
  },

  load: function (callback) {
    if (this.networks && this.versions) {
      callback(null);
    } else {
      loadPublish(this.model, _.bind(function (err, res) {
        if (!err) {
          this.networks = res.networks;
          this.versions = res.versions;
        }
        callback(err);
      }, this));
    }
  },


  // Events
  // ------

  events: {
    'click .publish-document': 'publishDocument',
    'click .remove-version': 'removeVersion'
  },

  publishDocument: function (e) {
    var networks = this.$('.networks-selection').val() || []
    ,   remark   = this.$('#version_remark').val();
    publishDocument(this.model, networks, remark, _.bind(function (err, res) {
      this.versions = this.networks = null;
      this.load(this.render);
    }, this));
    return false;
  },

  removeVersion: function (e) {
    var version = $(e.currentTarget).attr('data-version');
    removeVersion(this.model, version, _.bind(function () {
      this.versions = this.networks = null;
      this.load(this.render);
    }, this));
    return false;
  }

});
