var ConfirmCollaboration = Backbone.View.extend({
  
  initialize: function() {
    this.el = '#content_wrapper';
  },
  
  render: function() {    
    $(this.el).html(_.tpl('confirm_collaboration', {
      
    }));
    // $('#new_collaborator').suggestr(['John', 'Peter', 'Mark']);
    
    this.delegateEvents();
  }
});
