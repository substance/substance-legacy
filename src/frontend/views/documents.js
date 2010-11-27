var Documents = Backbone.View.extend({
  
  initialize: function(options) {
    
  },
  
  render: function() {    
    $(this.el).html(_.renderTemplate('documents', {
      documents: app.model.all('objects').toArray()
    }));
  }
});
