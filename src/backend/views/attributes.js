var Attributes = Backbone.View.extend({
  
  initialize: function() {
    var that = this;
    this.render();
        
  },
  
  render: function() {
    var that = this; 
    var doc = app.editor.model;
    
    $(this.el).html(Helpers.renderTemplate('edit_document', _.extend({
      attributes: doc.author ? settings.attributes : null,
      author: app.editor.model.author,
      created_at: new Date(doc.created_at).toDateString(),
      updated_at: _.prettyDate(doc.updated_at),
      published_on: doc.published_on ? new Date(doc.published_on).toDateString() : null,
      unpublished: !doc.published_on
    }, app.editor.model.data)));
        
    // Initialize AttributeEditors for non-unique-strings
    $('.attribute-editor').each(function() {
      var key = $(this).attr('key'),
          unique = $(this).hasClass('unique'),
          type = $(this).attr('type'),
          value = app.editor.model.attributes[key]; // property value / might be an array or a single value

      var editor = that.createAttributeEditor(key, type, unique, value, $(this));
      editor.bind('changed', function() {
        app.editor.model.attributes[key] = editor.value();
      });
    });
  },
  
  createAttributeEditor: function(key, type, unique, value, target) {
    switch (type) {
      case 'string':
        if (unique) {
          return this.createStringEditor(key, value, target);
        } else {
          return this.createMultiStringEditor(key, value, target);
        }
      break;
      case 'number':
      break;
      case 'boolean':
      break;
    }
  },
  
  createMultiStringEditor: function(key, value, target) {
    var that = this;
    var editor = new UI.MultiStringEditor({
      el: target,
      items: value
    });
    return editor;
  },
  
  createStringEditor: function(key, value, target) {
    var that = this;
    var editor = new UI.StringEditor({
      el: target,
      value: value
    });
    return editor;
  }
});
