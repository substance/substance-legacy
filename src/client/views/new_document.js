s.views.NewDocument = Backbone.View.extend({

  id: 'new_document',
  className: 'page-content',

  events: {
    'submit form': 'createDocument',
  },

  render: function () {    
    $(this.el).html(s.util.tpl('new_document', {}));
    return this;
  },
  
  createDocument: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var type = '/type/article' // $('#create_document select[name=document_type]').val()
    ,   title = this.$('#new_document_name').val()
    ,   name = s.util.slug(title);
    
    checkDocumentName(name, _.bind(function (valid) {
      if (valid) {
        notifier.notify(Notifications.BLANK_DOCUMENT);
        var doc = createDoc(type, name, title);
        graph.sync(function (err) {
          router.navigate(documentURL(doc), true);
        });
      } else {
        this.$('#new_document_name').addClass('error');
        this.$('#new_document_name_message').html("This document name is already taken.");
      }
    }, this));
  }
});
