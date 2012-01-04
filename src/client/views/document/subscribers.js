s.views.Subscribers = Backbone.View.extend({

  className: 'shelf-content',
  id: 'document_subscribers',

  initialize: function () {
    _.bindAll(this);
    this.data = null;
  },

  render: function () {
    $(this.el).html(s.util.tpl('document_subscribers', {
      document: this.model,
      subscriptions: this.data.subscriptions
    }));

    this.trigger('resize');
    return this;
  },

  load: function (callback) {
    if (this.data) {
      callback(null);
    } else {
      loadSubscribers(this.model, _.bind(function (err, res) {
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