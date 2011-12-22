s.views.Results = Backbone.View.extend({

  render: function() {
    $(this.el).html(s.util.tpl('results', {
      documents: this.model.documents
    }));
    return this;
  }

});
