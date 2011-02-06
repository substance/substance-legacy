var UserSettings = Backbone.View.extend({
  
  initialize: function() {
    
  },
  
  render: function() {    
    $(this.el).html(_.tpl('user_settings', {
    }));
  }
});