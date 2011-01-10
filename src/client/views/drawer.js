var Drawer = Backbone.View.extend({
  
  toggle: function(view) {
    if (!$('#main').hasClass('drawer-opened')) {
      // Set and render view
      this.view = view;
      this.renderContent();
    }
    
    $('#main').toggleClass('drawer-opened');
  },
  
  render: function() {
    var that = this;
    $(this.el).html(Helpers.renderTemplate('drawer', {}));
  },
  
  renderContent: function() {
    if (this.view) {
      this.content = new window[this.view]({el: '#drawer_content'});
    }
  }
});
