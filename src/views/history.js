sc.views.History = Backbone.View.extend({

  // Events
  // ------


  // Handlers
  // --------

  render: function () {
    this.$el.html(_.tpl('history', {operations: this.model.document.operations('master')}));
    return this;
  }
});