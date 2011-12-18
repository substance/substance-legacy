s.views.Results = Backbone.View.extend({
  render: function() {
    $('#browser_content').html(s.util.tpl('browser_results', {
      documents: this.model.documents,
      user: this.model.user
    }));
    return this;
  }
});
