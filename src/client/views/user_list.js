s.views.UserList = Backbone.View.extend({
  className: "user-list",

  initialize: function(options) {
  },

  render: function() {
    $(this.el).html(s.util.tpl('user_list', {
      users: this.model.members
    }));
    return this;
  }
});