s.views.Header = Backbone.View.extend({
  events: {
  },
  
  initialize: function(options) {
    this.userStatus = new s.views.UserStatus({});
  },

  render: function() {
    $(this.el).html(s.util.tpl('header', {
      user: graph.get('/user/' + session.username),
    }));
    $(this.userStatus.render().el).appendTo(this.el);
    
    return this;
  }
});
