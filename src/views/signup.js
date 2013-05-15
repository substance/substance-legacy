// Signup screen
// ---------------

sc.views.Signup = Substance.View.extend({
  id: 'container',
  render: function() {
    this.$el.html(_.tpl('signup'));
    return this;
  },
  dispose: function() {
    console.log('disposing signup view');
    this.disposeBindings();
  }
});