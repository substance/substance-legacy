s.views.Search = Backbone.View.extend({
  render: function() {
    $(this.el).html(s.util.tpl('search'));
    return this;
  }
});
