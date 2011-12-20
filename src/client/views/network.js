s.views.Network = Backbone.View.extend({

  events: {
    
  },

  render: function() {
    $(this.el).html(s.util.tpl('network', {
      network: this.model.network,
      members: this.model.members
    }));
    return this;
  }
});
