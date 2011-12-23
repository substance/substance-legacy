s.views.Network = Backbone.View.extend({

  events: {
    'click .join-network': '__joinNetwork',
    'click .leave-network': '__leaveNetwork'
  },

  __joinNetwork: function() {
    joinNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.reload();
    }, this));
    return false;
  },

  __leaveNetwork: function() {
    leaveNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.reload();
    }, this));
    return false;
  },

  initialize: function(options) {
    this.results = new s.views.Results({ model: this.model, id: "results" });
  },

  reload: function() {
    loadNetwork(networkSlug(this.model.network), _.bind(function(err, data) {
      this.model = data;
      this.render();
    }, this));
  },

  render: function() {
    $(this.el).html(s.util.tpl('network', this.model));
    this.$(this.results.render().el).appendTo(this.el);
    return this;
  }
});
