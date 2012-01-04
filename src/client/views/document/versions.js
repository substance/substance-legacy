s.views.Versions = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_versions',

  initialize: function () {
    _.bindAll(this);
    this.data = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_versions', {
      document: this.model
    }));

    this.trigger('resize');
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
  }

});