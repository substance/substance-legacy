var Attributes = Backbone.View.extend({
  
  initialize: function() {
    var that = this;
  },
  
  render: function() {
    app.document.mode === 'edit' ? this.renderEdit() : this.renderShow();
  },
  
  renderShow: function() {
    $(this.el).html('');
  },
  
  availableAttributes: function(property) {
    return graph.find({
      "type|=": ['/type/attribute'],
      member_of: '/'+ property.type._id.split('/')[2]+'/'+property.key
    });
  },
  
  renderEdit: function() {
    var that = this; 
    var doc = app.document.model;
    var attributes = [];
    
    var attributes = doc.properties().select(function(property) {
      if (property.expectedTypes[0] === '/type/attribute') {
        return true;
      }
    });
    
    $(this.el).html(_.tpl('edit_attributes', {
      attributes: attributes,
      doc: doc
    }));
    
    
    // Initialize AttributeEditors for non-unique-strings
    $('.attribute-editor').each(function() {
      var member_of = $(this).attr('property');
      var property = graph.get('/type/'+member_of.split('/')[1]).get('properties', member_of.split('/')[2]),
          key = $(this).attr('key'),
          unique = $(this).hasClass('unique'),
          type = $(this).attr('type');
          
          // property value / might be an array or a single value
          value = unique 
                  ? app.document.model.get(key).get('name') 
                  : _.map(app.document.model.get(key).values(), function(v) { return v.get('name'); });
    
          var availableAttributes = _.uniq(_.map(that.availableAttributes(property).values(), function(val) {
            return val.get('name');
          }));
                  
      var editor = that.createAttributeEditor(key, type, unique, value, availableAttributes, $(this));
      
      editor.bind('changed', function() {        
        var attrs = [];
        var availableAttributes = that.availableAttributes(property);
        
        _.each(editor.value(), function(val) {
          // Find existing attribute
          var attr = graph.find({
            "type|=": ['/type/attribute'],
            member_of: member_of,
            name: val
          }).first();
          
          if (!attr) {
            // Create attribute as it doesn't exist
            attr = graph.set(null, {
              type: ["/type/attribute"],
              member_of: member_of,
              name: val
            });
          }
          attrs.push(attr._id);
        });
        
        // Update document
        var tmp = {};
        tmp[key] = attrs;
        app.document.model.set(tmp);
      });
    });
  },
  
  createAttributeEditor: function(key, type, unique, value, availableValues, target) {
    switch (type) {
      case 'string':
        if (unique) {
          return this.createStringEditor(key, value, availableValues, target);
        } else {
          return this.createMultiStringEditor(key, value, availableValues, target);
        }
      break;
      case 'number':
      break;
      case 'boolean':
      break;
    }
  },
  
  createMultiStringEditor: function(key, value, availableValues, target) {
    var that = this;
    var editor = new UI.MultiStringEditor({
      el: target,
      items: value,
      availableItems: availableValues
    });
    return editor;
  },
  
  createStringEditor: function(key, availableValues, target) {
    var that = this;
    var editor = new UI.StringEditor({
      el: target,
      value: value,
      availableItems: availableValues
    });
    return editor;
  }
});
