var Collaborators = Backbone.View.extend({
  
  initialize: function() {
    this.render();
  },
  
  render: function() {    
    $(this.el).html(Helpers.renderTemplate('collaborators', {
      status: app.status,
      id: app.model.id,
      hostname: window.location.hostname + (window.location.port !== 80 ? ":" + window.location.port : "")
    }));
  }
});