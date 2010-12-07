var Drawer = Backbone.View.extend({
  events: {
    'click .toggle a': 'toggle'
  },

  toggle: function(e) {
    $(this.el).parent().toggleClass('drawer-opened');
  },
  
  render: function() {
    var that = this;
    
    $(this.el).html(Helpers.renderTemplate('drawer', {}));
    
    // bind events manually since declarative events do not work here for some reason
    this.$('.toggle a').click(function(e) {
      that.toggle(e);
    });
  }
});