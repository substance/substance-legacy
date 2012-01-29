s.views.Import = Backbone.View.extend({

  id: 'import',
  className: 'page-content',

  events: {
    'submit form': 'importDocument'
  },

  render: function () {    
    $(this.el).html(s.util.tpl('import', {}));
    setTimeout(function () {
      var cm = CodeMirror.fromTextArea(this.$('textarea').get(0), {
        lineNumbers: true,
        theme: 'elegant'
      });
      cm.focus();
    }, 10);
    return this;
  },
  
  importDocument: function (e) {
    e.preventDefault();
    e.stopPropagation();
    
    var type = '/type/article' // $('#create_document select[name=document_type]').val()
    ,   title = this.$('#new_document_name').val()
    ,   format = this.$('#format').val()
    ,   text = this.$('#text').val()
    ,   name = s.util.slug(title);
    
    checkDocumentName(name, _.bind(function (valid) {
      if (valid) {
        notifier.notify(Notifications.BLANK_DOCUMENT);
        var doc = createDoc(type, name, title);
        importFromText(doc, format, text, function (err) {
          if (err) { console.error(err); }
          graph.sync(function (err) {
            router.navigate(documentURL(doc), true);
          });
        });
      } else {
        this.$('#new_document_name').addClass('error');
        this.$('#new_document_name_message').html("This document name is already taken.");
      }
    }, this));
  }
});
