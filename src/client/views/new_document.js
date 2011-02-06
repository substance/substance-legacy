var NewDocument = Backbone.View.extend({
  
  initialize: function() {
    
  },
  
  render: function() {    
    $(this.el).html(_.tpl('new_document', {}));
  }
});