var Attributes = Backbone.View.extend({
  
  initialize: function() {
    var that = this;
  },
  
  render: function() {
    app.document.mode === 'edit' ? this.renderEdit() : this.renderShow();
  },
  
  renderShow: function() {
    var doc = app.document.model;
    var attributes = [];
    
    doc.properties().each(function(property) {
      if (property.meta.attribute) {
        attributes.push({
          "key": property.key,
          "name": property.name,
          "type": property.expectedTypes[0],
          "unique": property.unique,
          "values": doc.get(property.key).values()
        });
      }
    });
    
    $(this.el).html(Helpers.renderTemplate('show_attributes', {
      attributes: attributes,
      document: doc.toJSON(),
      creator: doc.get('creator') ? doc.get('creator')._id.split('/')[2] : null,
      created_at: doc.get('created_at') ? new Date(doc.get('created_at')).toDateString() : null,
      updated_at: doc.get('updated_at') ? _.prettyDate(new Date(doc.get('updated_at')).toJSON()) : null,
      published_on: doc.get('published_on') ? new Date(doc.get('published_on')).toDateString() : null,
      unpublished: !doc.get('published_on')
    }));
  },
  
  renderEdit: function() {
    var that = this; 
    var doc = app.document.model;
    var attributes = [];
    
    // Extract attributes from properties
    doc.properties().each(function(property) {
      if (property.meta.attribute) {
        attributes.push({
          "key": property.key,
          "name": property.name,
          "type": property.expectedTypes[0], 
          "unique": property.unique,
          "default": property["default"]
        });
      }
    });

    if (doc.get('name')) {
      $(this.el).html(Helpers.renderTemplate('edit_attributes', {
        attributes: doc.get('name') ? attributes : null,
        document: doc.toJSON(),
        creator: doc.get('creator') ? doc.get('creator')._id.split('/')[2] : null,
        created_at: doc.get('created_at') ? new Date(doc.get('created_at')).toDateString() : null,
        updated_at: doc.get('updated_at') ? _.prettyDate(new Date(doc.get('updated_at')).toJSON()) : null,
        published_on: doc.get('published_on') ? new Date(doc.get('published_on')).toDateString() : null,
        unpublished: !doc.get('published_on')
      }));
    } else {
      $(this.el).html(Helpers.renderTemplate('edit_unsaved_document', {}));
    }
    
    // Initialize AttributeEditors for non-unique-strings
    $('.attribute-editor').each(function() {
      var key = $(this).attr('key'),
          unique = $(this).hasClass('unique'),
          type = $(this).attr('type'),
          // property value / might be an array or a single value
          value = unique ? app.document.model.get(key) : app.document.model.get(key).values();
    
      var editor = that.createAttributeEditor(key, type, unique, value, $(this));
      
      editor.bind('changed', function() {
        var attrs = {};
        attrs[key] = editor.value();
        app.document.model.set(attrs);
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
