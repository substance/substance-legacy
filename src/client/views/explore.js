s.views.Explore = Backbone.View.extend({

  render: function() {
    $(this.el).html(s.util.tpl('explore', this.model));
    return this;
  }

});
