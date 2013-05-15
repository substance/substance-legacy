sc.views.History = Substance.View.extend({

  // Events
  // ------


  // Handlers
  // --------

  render: function () {
    this.$el.html(_.tpl('history', {operations: this.model.document.operations('master')}));
    return this;
  },

  dispose: function() {
    console.log('disposing history view');
    this.disposeBindings();
  }
});