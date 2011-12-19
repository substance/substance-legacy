s.views.Explore = Backbone.View.extend({

  events: {
    'click .network': '__toggleNetwork'
  },

  __toggleNetwork: function(e) {
    this.updateResults($(e.currentTarget).attr('data-network'));
    return false;
  },

  // For a particular network selection load results
  updateResults: function(network) {
    var that = this;
    
    loadDocuments({"type": "user", "value": "michael"}, function (err, data) {
      that.results = new s.views.UserBrowser({ model: data, el: "#results" }).render();
    });
  },

  render: function() {
    $(this.el).html(s.util.tpl('explore', {
      networks: this.model.networks
    }));
    return this;
  }

});
