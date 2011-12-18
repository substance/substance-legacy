s.views.NewDocument = Backbone.View.extend({

  events: {
    'submit #create_document': 'createDocument',
  },

  render: function() {    
    $(this.el).html(s.util.tpl('new_document', {}));
    return this;
  },
  
  createDocument: function(e) {
    var that = this;
    var title = $('#create_document input[name=new_document_name]').val();
    var name = _.slug(title);
    var type = "/type/article"; // $('#create_document select[name=document_type]').val();
    
    this.checkDocumentName(name, function(valid) {
      if (valid) {
        that.document.newDocument(type, name, title);
      } else {
        $('#create_document input[name=new_document_name]').addClass('error');
        $('#new_document_name_message').html('This document name is already taken.');
      }
    });
    
    return false;
  }
});
