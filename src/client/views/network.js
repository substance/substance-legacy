s.views.Network = Backbone.View.extend({

  events: {
    
  },
 
  initialize: function(options) {
    this.results = new s.views.Results({ model: this.model, id: "results" });
  },

  render: function() {
    $(this.el).html(s.util.tpl('network', {
      network: this.model.network,
      members: this.model.members
    }));
    
    this.$(this.results.render().el).appendTo(this.el);
    
    return this;
  }
});
