s.views.Explore = Backbone.View.extend({

  render: function() {
    $(this.el).html(s.util.tpl('explore', {
      networks: this.model.networks
    }));
    return this;
  }

});
