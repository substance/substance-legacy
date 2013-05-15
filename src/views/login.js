  // Login screen
  // ---------------

sc.views.Login = Substance.View.extend({
  id: 'container',
  render: function() {
    this.$el.html(_.tpl('login'));
    return this;
  },
  dispose: function() {
    console.log('disposing login view');
    this.disposeBindings();
  }
});