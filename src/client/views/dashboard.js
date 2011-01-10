var Dashboard = Backbone.View.extend({
  
  render: function() {
    var that = this;
    // Render the stuff
    $(this.el).html(Helpers.renderTemplate('dashboard', {
      active_users: app.activeUsers
    }));
    
    this.browser = new DocumentBrowser({
      el: this.$('#document_browser'),
      query: {"type|=": ["/type/document"], "creator": "/user/"+app.username }
    });
  }
});
