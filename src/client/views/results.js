s.views.Results = Backbone.View.extend({

  render: function() {
    $(this.el).html(s.util.tpl('results', this.model));
    return this;
  }
});
