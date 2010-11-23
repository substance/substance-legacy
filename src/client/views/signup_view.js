var SignupView = Backbone.View.extend({
  
  initialize: function() {
    this.render();
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('signup', {}));
  }
});