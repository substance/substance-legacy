var Dashboard = Backbone.View.extend({
  
  render: function() {    
    // Render the stuff
    $(this.el).html(Helpers.renderTemplate('dashboard', {}));
    
    this.browser = new DocumentBrowser({
      el: this.$('#document_browser')
    });
  }
});
