var DocumentSettings = Backbone.View.extend({
  events: {
    'submit form': 'invite'
  },

  invite: function() {
    $.ajax({
      type: "POST",
      url: "/invite",
      data: {
        email: $('#collaborator_email').val(),
        document: app.document.model._id
      },
      dataType: "json",
      success: function(res) {
        console.log('Invited.');
        console.log(res);
      },
      error: function(err) {
        console.log('an error occurred');
        console.log(err);
      }
    });
    
    return false;
  },
  
  initialize: function() {
    this.el = '#document_settings';
  },
  
  render: function() {
    $(this.el).html(_.tpl('document_settings', {
      
    }));
    
    // $('#new_collaborator').suggestr(['John', 'Peter', 'Mark']);
    
    this.delegateEvents();
  }
});
