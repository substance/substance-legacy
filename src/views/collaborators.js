// DocumentBrowser widget / used to select a document to load
var Collaborators = Backbone.View.extend({
  
  initialize: function() {
    this.render();
  },
  
  render: function() {
    $(this.el).html(Helpers.renderTemplate('collaborators', {
      
    }));
  }
});