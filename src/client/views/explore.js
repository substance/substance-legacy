s.views.Explore = Backbone.View.extend({


  // For a particular network selection load results
  loadResults: function(network) {
  	this.results = new s.views.Results({ model: this.model, id: "results" });
  },

  render: function() {
    $(this.el).html(s.util.tpl('explore', {
      networks: this.model.networks
    }));
    
    if (this.results) this.$(this.results.render().el).appendTo(this.el);
    return this;
  }
});
