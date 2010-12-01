var CreateDocument = Backbone.View.extend({
  
  initialize: function() {
    this.render();
  },
  
  render: function() {    
    $(this.el).html(Helpers.renderTemplate('create_document', {}));
  }
});